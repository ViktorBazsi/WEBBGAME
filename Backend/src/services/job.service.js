import prisma from "../models/prisma-client.js";
import HttpError from "../utils/HttpError.js";
import { ensureStatsWithMeasurement } from "../utils/stats.helper.js";
import { advanceTime, formatHHMM } from "../utils/time.helper.js";

const recalcHousehold = async (characterId) => {
  const c = await prisma.character.findUnique({
    where: { id: characterId },
    include: { girlfriends: true },
  });
  if (!c) return null;
  const charMoney = c.charMoney ?? 0;
  const gfMoney = (c.girlfriends || []).reduce((sum, g) => sum + (g.girMoney ?? 0), 0);
  const household = charMoney + gfMoney;
  await prisma.character.update({
    where: { id: characterId },
    data: { householdMoney: household },
  });
  return household;
};

export const listJobs = () =>
  prisma.job.findMany({ include: { characters: true, girlfriends: true } });

export const getJob = async (id) => {
  const job = await prisma.job.findUnique({
    where: { id },
    include: { characters: true, girlfriends: true },
  });
  if (!job) throw new HttpError("Munka nem található", 404);
  return job;
};

export const createJob = (data) =>
  prisma.job.create({ data, include: { characters: true, girlfriends: true } });

export const updateJob = async (id, data) => {
  await getJob(id);
  return prisma.job.update({
    where: { id },
    data,
    include: { characters: true, girlfriends: true },
  });
};

export const deleteJob = async (id) => {
  await getJob(id);
  await prisma.job.delete({ where: { id } });
  return true;
};

const ensureCharacterJobProgress = async (characterId, jobId) => {
  return prisma.characterJobProgress.upsert({
    where: { characterId_jobId: { characterId, jobId } },
    update: {},
    create: { characterId, jobId },
  });
};

const ensureGirlfriendJobProgress = async (girlfriendId, jobId) => {
  return prisma.girlfriendJobProgress.upsert({
    where: { girlfriendId_jobId: { girlfriendId, jobId } },
    update: {},
    create: { girlfriendId, jobId },
  });
};

const handleLevelUp = (currentXp, xpGain, xpNeeded, currentLevel) => {
  const newXp = Math.min(currentXp + xpGain, xpNeeded);
  const leveledUp = newXp >= xpNeeded;
  // szintet nem léptetünk automatikusan, csak jelzünk
  return { level: currentLevel, xp: newXp, leveledUp };
};

const renderJobDescription = (description, performerName) => {
  if (!description) return "";
  let rendered = description;
  const replacements = [
    { token: "{{name}}", value: performerName },
    { token: "[name]", value: performerName },
  ];
  for (const r of replacements) {
    rendered = rendered.split(r.token).join(r.value);
  }
  return rendered;
};

export const workJobForCharacter = async (userId, characterId, jobId, isAdmin = false) => {
  const character = await prisma.character.findFirst({
    where: isAdmin ? { id: characterId } : { id: characterId, userId },
    include: { stats: { include: { measurement: true } }, jobs: true },
  });
  if (!character) throw new HttpError("Karakter nem található vagy nincs jogosultság", 404);

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpError("Munka nem található", 404);

  const hasJob = character.jobs.some((j) => j.id === jobId);
  if (!hasJob) throw new HttpError("Karakterhez nincs hozzárendelve ez a munka", 400);

  const stats = await ensureStatsWithMeasurement(character, false);
  const staminaCost = job.staminaCost ?? 0;
  if ((stats.currentStamina ?? 0) < staminaCost) {
    throw new HttpError("Nincs elég stamina a munkához", 400);
  }

  const progress = await ensureCharacterJobProgress(character.id, jobId);
  const { level: newLevel, xp: newXp, leveledUp } = handleLevelUp(
    progress.currentXp ?? 0,
    job.xpGained ?? 0,
    job.xpNeeded ?? 50,
    progress.level ?? 1,
  );

  const updatedProgress = await prisma.characterJobProgress.update({
    where: { characterId_jobId: { characterId: character.id, jobId } },
    data: { level: newLevel, currentXp: newXp },
  });

  const statXpMap = [
    { key: "strXp", levelKey: "str", xpKey: "currStrXp", type: "STR" },
    { key: "staXp", levelKey: "sta", xpKey: "currStaXp", type: "STA" },
    { key: "intXp", levelKey: "int", xpKey: "currIntXp", type: "INT" },
    { key: "charXp", levelKey: "char", xpKey: "currCharXp", type: "CHAR" },
  ];
  const statUpdates = { currentStamina: Math.max((stats.currentStamina ?? 0) - staminaCost, 0) };
  const statMessages = [];
  const statWarnings = [];
  for (const s of statXpMap) {
    const gain = job[s.key] ?? 0;
    if (!gain) continue;
    const levelVal = stats[s.levelKey] ?? 0;
    const currXpVal = stats[s.xpKey] ?? 0;
    const req = await prisma.statRequirement.findUnique({
      where: { statType_level: { statType: s.type, level: levelVal } },
    });
    const needed = req?.neededXp ?? 999;
    const nextXp = Math.min(currXpVal + gain, needed);
    if (currXpVal + gain >= needed) {
      statWarnings.push(`${s.type} elérte a szintlépéshez szükséges XP-t, aludj egyet a szintlépéshez.`);
    }
    statUpdates[s.xpKey] = nextXp;
    statMessages.push(`${s.type} XP +${gain}`);
  }

  const updatedStats = await prisma.stats.update({
    where: { id: stats.id },
    data: statUpdates,
  });

  const newTime = job.length
    ? advanceTime(character.time, job.length, character.day)
    : { minutes: character.time, day: character.day, formatted: character.currentTime };
  const updatedCharacter = await prisma.character.update({
    where: { id: character.id },
    data: {
      charMoney: (character.charMoney ?? 0) + (job.money ?? 0),
      time: newTime.minutes,
      currentTime: newTime.formatted,
      day: newTime.day,
    },
    include: { stats: { include: { measurement: true } } },
  });
  await recalcHousehold(character.id);

  const performerName = updatedCharacter?.name ?? character.name;
  const filledDescription = renderJobDescription(job.description, performerName);

  return {
    character: updatedCharacter,
    job,
    progress: updatedProgress,
    stamina: updatedStats.currentStamina,
    leveledUp,
    promotionAvailable: leveledUp,
    description: filledDescription,
    message: [
      filledDescription,
      leveledUp
        ? `Elérted a(z) ${job.name} szintlépéshez szükséges XP-jét. Dönts az előléptetésről!`
        : `XP növelve a(z) ${job.name} munkában.`,
      statMessages.length ? `Stat XP: ${statMessages.join(", ")}` : "",
      statWarnings.length ? statWarnings.join(" ") : "",
    ]
      .filter(Boolean)
      .join(" "),
    time: { minutes: updatedCharacter.time, formatted: updatedCharacter.currentTime },
  };
};

export const promoteJobForCharacter = async (userId, characterId, jobId, isAdmin = false) => {
  const character = await prisma.character.findFirst({
    where: isAdmin ? { id: characterId } : { id: characterId, userId },
    include: { jobs: true },
  });
  if (!character) throw new HttpError("Karakter nem található vagy nincs jogosultság", 404);

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpError("Munka nem található", 404);

  const progress = await prisma.characterJobProgress.findUnique({
    where: { characterId_jobId: { characterId, jobId } },
  });
  if (!progress) throw new HttpError("Nincs progress ehhez a munkához", 400);
  if (progress.currentXp < (job.xpNeeded ?? 50)) {
    throw new HttpError("Nincs elég job XP az előléptetéshez", 400);
  }

  const nextJob = await prisma.job.findFirst({
    where: { jobType: job.jobType, level: (job.level ?? 1) + 1 },
    orderBy: { level: "asc" },
  });
  if (!nextJob) throw new HttpError("Nincs magasabb szintű munka ebben a családban", 400);

  const carryXp = progress.currentXp;
  const carryLevel = nextJob.level ?? (progress.level ?? 1) + 1;

  await prisma.character.update({
    where: { id: character.id },
    data: {
      jobs: {
        disconnect: { id: job.id },
        connect: { id: nextJob.id },
      },
    },
  });

  await prisma.characterJobProgress.delete({
    where: { characterId_jobId: { characterId, jobId } },
  }).catch(() => {});

  const updatedProgress = await prisma.characterJobProgress.upsert({
    where: { characterId_jobId: { characterId, jobId: nextJob.id } },
    update: { level: carryLevel, currentXp: carryXp },
    create: { characterId, jobId: nextJob.id, level: carryLevel, currentXp: carryXp },
  });

  return {
    job: nextJob,
    progress: updatedProgress,
    message: `Előléptetve a(z) ${job.name} -> ${nextJob.name} munkára.`,
  };
};

export const promoteJobForGirlfriend = async (userId, girlfriendId, jobId, isAdmin = false) => {
  const gf = await prisma.girlfriend.findFirst({
    where: isAdmin ? { id: girlfriendId } : { id: girlfriendId, character: { userId } },
    include: { jobs: true },
  });
  if (!gf) throw new HttpError("Barátnő nem található vagy nincs jogosultság", 404);

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpError("Munka nem található", 404);

  const progress = await prisma.girlfriendJobProgress.findUnique({
    where: { girlfriendId_jobId: { girlfriendId, jobId } },
  });
  if (!progress) throw new HttpError("Nincs progress ehhez a munkához", 400);
  if (progress.currentXp < (job.xpNeeded ?? 50)) {
    throw new HttpError("Nincs elég job XP az előléptetéshez", 400);
  }

  const nextJob = await prisma.job.findFirst({
    where: { jobType: job.jobType, level: (job.level ?? 1) + 1 },
    orderBy: { level: "asc" },
  });
  if (!nextJob) throw new HttpError("Nincs magasabb szintű munka ebben a családban", 400);

  const carryXp = progress.currentXp;
  const carryLevel = nextJob.level ?? (progress.level ?? 1) + 1;

  await prisma.girlfriend.update({
    where: { id: gf.id },
    data: {
      jobs: {
        disconnect: { id: job.id },
        connect: { id: nextJob.id },
      },
    },
  });

  await prisma.girlfriendJobProgress.delete({
    where: { girlfriendId_jobId: { girlfriendId: gf.id, jobId: job.id } },
  }).catch(() => {});

  const updatedProgress = await prisma.girlfriendJobProgress.upsert({
    where: { girlfriendId_jobId: { girlfriendId: gf.id, jobId: nextJob.id } },
    update: { level: carryLevel, currentXp: carryXp },
    create: { girlfriendId: gf.id, jobId: nextJob.id, level: carryLevel, currentXp: carryXp },
  });

  return {
    job: nextJob,
    progress: updatedProgress,
    message: `Előléptetve a(z) ${job.name} -> ${nextJob.name} munkára.`,
  };
};

export const workJobForGirlfriend = async (userId, girlfriendId, jobId, isAdmin = false) => {
  const gf = await prisma.girlfriend.findFirst({
    where: isAdmin ? { id: girlfriendId } : { id: girlfriendId, character: { userId } },
    include: { stats: { include: { measurement: true } }, jobs: true, character: true },
  });
  if (!gf) throw new HttpError("Barátnő nem található vagy nincs jogosultság", 404);
  if (!gf.characterId) throw new HttpError("A barátnő nincs karakterhez kötve", 400);

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpError("Munka nem található", 404);

  const hasJob = gf.jobs.some((j) => j.id === jobId);
  if (!hasJob) throw new HttpError("Barátnőhöz nincs hozzárendelve ez a munka", 400);

  const stats = await ensureStatsWithMeasurement(gf, true);
  const staminaCost = job.staminaCost ?? 0;
  if ((stats.currentStamina ?? 0) < staminaCost) {
    throw new HttpError("Nincs elég stamina a munkához", 400);
  }

  const progress = await ensureGirlfriendJobProgress(gf.id, jobId);
  const { level: newLevel, xp: newXp, leveledUp } = handleLevelUp(
    progress.currentXp ?? 0,
    job.xpGained ?? 0,
    job.xpNeeded ?? 50,
    progress.level ?? 1,
  );

  const updatedProgress = await prisma.girlfriendJobProgress.update({
    where: { girlfriendId_jobId: { girlfriendId: gf.id, jobId } },
    data: { level: newLevel, currentXp: newXp },
  });

  const statXpMap = [
    { key: "strXp", levelKey: "str", xpKey: "currStrXp", type: "STR" },
    { key: "staXp", levelKey: "sta", xpKey: "currStaXp", type: "STA" },
    { key: "intXp", levelKey: "int", xpKey: "currIntXp", type: "INT" },
    { key: "charXp", levelKey: "char", xpKey: "currCharXp", type: "CHAR" },
  ];
  const statUpdates = { currentStamina: Math.max((stats.currentStamina ?? 0) - staminaCost, 0) };
  const statMessages = [];
  const statWarnings = [];
  for (const s of statXpMap) {
    const gain = job[s.key] ?? 0;
    if (!gain) continue;
    const levelVal = stats[s.levelKey] ?? 0;
    const currXpVal = stats[s.xpKey] ?? 0;
    const req = await prisma.statRequirement.findUnique({
      where: { statType_level: { statType: s.type, level: levelVal } },
    });
    const needed = req?.neededXp ?? 999;
    const nextXp = Math.min(currXpVal + gain, needed);
    if (currXpVal + gain >= needed) {
      statWarnings.push(`${s.type} elérte a szintlépéshez szükséges XP-t, aludj egyet a szintlépéshez.`);
    }
    statUpdates[s.xpKey] = nextXp;
    statMessages.push(`${s.type} XP +${gain}`);
  }

  const updatedStats = await prisma.stats.update({
    where: { id: stats.id },
    data: statUpdates,
  });

  const timeSource = gf.time ?? gf.character.time;
  const daySource = gf.day ?? gf.character.day;
  const newTime = job.length
    ? advanceTime(timeSource, job.length, daySource)
    : { minutes: timeSource, formatted: formatHHMM(timeSource % 1440), day: daySource };

  // pénz a karakterhez megy, idő a barátnőn fut
  const updatedGirlfriend = await prisma.girlfriend.update({
    where: { id: gf.id },
    data: { girMoney: (gf.girMoney ?? 0) + (job.money ?? 0) },
    include: { stats: { include: { measurement: true } }, jobs: true, character: true },
  });
  const updatedCharacter = await prisma.character.findUnique({
    where: { id: gf.characterId },
    include: { stats: { include: { measurement: true } } },
  });
  await recalcHousehold(gf.characterId);

  const refreshedGf = await prisma.girlfriend.update({
    where: { id: gf.id },
    data: { time: newTime.minutes, currentTime: newTime.formatted, day: newTime.day },
    include: { stats: { include: { measurement: true } }, jobs: true, character: true },
  });

  const performerName = refreshedGf?.name ?? gf.name;
  const filledDescription = renderJobDescription(job.description, performerName);

  return {
    girlfriend: refreshedGf,
    character: updatedCharacter,
    job,
    progress: updatedProgress,
    stamina: updatedStats.currentStamina,
    leveledUp,
    promotionAvailable: leveledUp,
    description: filledDescription,
    message: [
      filledDescription,
      leveledUp
        ? `Elérted a(z) ${job.name} szintlépéshez szükséges XP-jét. Dönts az előléptetésről!`
        : `XP növelve a(z) ${job.name} munkában.`,
      statMessages.length ? `Stat XP: ${statMessages.join(", ")}` : "",
      statWarnings.length ? statWarnings.join(" ") : "",
    ]
      .filter(Boolean)
      .join(" "),
    time: {
      minutes: refreshedGf.time,
      formatted: refreshedGf.currentTime,
    },
  };
};
