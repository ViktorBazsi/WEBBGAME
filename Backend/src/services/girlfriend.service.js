import prisma from "../models/prisma-client.js";
import HttpError from "../utils/HttpError.js";
import { ensureStatsWithMeasurement } from "../utils/stats.helper.js";
import { advanceTime, formatHHMM } from "../utils/time.helper.js";

const scaleLiftTier = (level, baseFactor, highFactor, breakpoint = 5) => {
  const steps = Math.max(0, (level ?? 1) - 1);
  const baseSteps = Math.min(breakpoint - 1, steps);
  const highSteps = Math.max(0, steps - (breakpoint - 1));
  return Math.pow(baseFactor, baseSteps) * Math.pow(highFactor, highSteps);
};

const ensureCharacterOwnership = async (userId, characterId, isAdmin = false) => {
  const character = await prisma.character.findFirst({
    where: isAdmin ? { id: characterId } : { id: characterId, userId },
  });
  if (!character) throw new HttpError("Nincs jogosultság a karakterhez", 403);
  return character;
};

const upsertMeasurementBase = async (statsId, measurement = {}, gender = "FEMALE") => {
  if (!measurement || !statsId) return null;
  const statRecord = await prisma.stats.findUnique({
    where: { id: statsId },
    select: { measurementId: true },
  });
  if (statRecord?.measurementId) {
    return prisma.measurements.update({
      where: { id: statRecord.measurementId },
      data: { ...measurement, gender: measurement.gender ?? gender, strLevel: measurement.strLevel ?? 1 },
    });
  }
  const created = await prisma.measurements.create({
    data: { ...measurement, gender: measurement.gender ?? gender, strLevel: measurement.strLevel ?? 1 },
  });
  await prisma.stats.update({
    where: { id: statsId },
    data: { measurementId: created.id },
  });
  return created;
};

export const listGirlfriends = async (userId) => {
  const gfs = await prisma.girlfriend.findMany({
    where: { character: { userId } },
    include: {
      stats: { include: { measurement: true } },
      character: true,
      jobs: true,
      jobProgress: { include: { job: true } },
      location: true,
    },
  });
  for (const g of gfs) {
    if (g.stats && g.stats[0]) {
      g.stats[0] = await ensureStatsWithMeasurement(g, true);
    }
  }
  return gfs;
};

export const listAllGirlfriends = async () => {
  const gfs = await prisma.girlfriend.findMany({
    include: {
      stats: { include: { measurement: true } },
      character: true,
      jobs: true,
      jobProgress: { include: { job: true } },
      location: true,
    },
  });
  for (const g of gfs) {
    if (g.stats && g.stats[0]) {
      g.stats[0] = await ensureStatsWithMeasurement(g, true);
    }
  }
  return gfs;
};

export const listAvailableSingles = async () => {
  const gfs = await prisma.girlfriend.findMany({
    where: { characterId: null },
    include: {
      stats: { include: { measurement: true } },
      character: true,
      jobs: true,
      jobProgress: { include: { job: true } },
      location: true,
    },
  });
  for (const g of gfs) {
    if (g.stats && g.stats[0]) {
      g.stats[0] = await ensureStatsWithMeasurement(g, true);
    }
  }
  return gfs;
};

export const getGirlfriend = async (userId, id, { allowOrphan = false, isAdmin = false } = {}) => {
  const gf = await prisma.girlfriend.findFirst({
    where: isAdmin
      ? { id }
        : {
            id,
            OR: [
              { character: { userId } },
              ...(allowOrphan ? [{ characterId: null }] : []),
            ],
          },
    include: {
      stats: { include: { measurement: true } },
      character: true,
      jobs: true,
      jobProgress: { include: { job: true } },
      location: true,
    },
  });
  if (!gf) throw new HttpError("Barátnő nem található", 404);
  if (gf.stats && gf.stats[0]) {
    gf.stats[0] = await ensureStatsWithMeasurement(gf, true);
  }
  return gf;
};

export const createGirlfriend = async (userId, payload) => {
  const { name, characterId, stats, locationId } = payload;

  if (characterId) {
    await ensureCharacterOwnership(userId, characterId);
  }

  const created = await prisma.girlfriend.create({
    data: {
      name,
      characterId: characterId || null,
      locationId: locationId || null,
      stats: stats
        ? {
            create: [stats],
          }
        : undefined,
    },
    include: { stats: true },
  });

  if (created.stats && created.stats.length) {
    await ensureStatsWithMeasurement(created, true);
  }

  return getGirlfriend(userId, created.id, { isAdmin: true, allowOrphan: true });
};

export const updateGirlfriend = async (userId, id, payload) => {
  const gf = await getGirlfriend(userId, id, { isAdmin: true });
  const { stats, characterId, measurement, ...rest } = payload;

  if (characterId && characterId !== gf.characterId) {
    await ensureCharacterOwnership(userId, characterId, true);
  }

  await prisma.girlfriend.update({
    where: { id },
    data: { ...rest, characterId: characterId || gf.characterId },
  });

  if (stats && gf.stats.length) {
    const statsUpdate = { ...stats };
    if (stats.sta != null && stats.currentStamina == null) {
      statsUpdate.currentStamina = stats.sta;
    }
    await prisma.stats.update({
      where: { id: gf.stats[0].id },
      data: statsUpdate,
    });
    if (measurement) {
      await upsertMeasurementBase(gf.stats[0].id, measurement, "FEMALE");
    }
  } else if (stats) {
    await prisma.stats.create({
      data: { ...stats, girlfriendId: gf.id },
    });
    const newStats = await prisma.stats.findFirst({
      where: { girlfriendId: gf.id },
      orderBy: { id: "desc" },
    });
    if (newStats) {
      if (measurement) {
        await upsertMeasurementBase(newStats.id, measurement, "FEMALE");
      }
    }
  } else if (measurement && gf.stats[0]) {
    await upsertMeasurementBase(gf.stats[0].id, measurement, "FEMALE");
  }

  return getGirlfriend(userId, id, { isAdmin: true, allowOrphan: true });
};

export const deleteGirlfriend = async (userId, id) => {
  await getGirlfriend(userId, id, { isAdmin: true });
  await prisma.girlfriend.delete({ where: { id } });
  return true;
};

export const assignGirlfriendToCharacter = async (userId, girlfriendId, characterId) => {
  await ensureCharacterOwnership(userId, characterId);
  const gf = await getGirlfriend(userId, girlfriendId, { allowOrphan: true });

  if (gf.affection < 50) {
    throw new HttpError("Affection legalább 50 kell az összekötéshez", 400);
  }

  return prisma.girlfriend.update({
    where: { id: gf.id },
    data: { characterId },
    include: { character: true, stats: { include: { measurement: true } }, jobs: true, location: true },
  });
};

export const assignJobToGirlfriend = async (userId, girlfriendId, jobId, isAdmin = false) => {
  const gf = await prisma.girlfriend.findFirst({
    where: isAdmin
      ? { id: girlfriendId }
      : { id: girlfriendId, character: { userId } },
    include: { character: true, stats: true, achievements: true },
  });
  if (!gf) throw new HttpError("Barátnő nem található vagy nincs jogosultság", 404);
  if (!gf.characterId) {
    throw new HttpError("A barátnő nincs karakterhez kötve", 400);
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpError("Munka nem található", 404);

  const stats = gf.stats?.[0];
  const statRequirements = [
    { key: "str", value: job.str },
    { key: "dex", value: job.dex },
    { key: "int", value: job.int },
    { key: "char", value: job.char },
  ];
  for (const req of statRequirements) {
    if (req.value != null && (stats?.[req.key] ?? 0) < req.value) {
      throw new HttpError(`Nincs meg a szükséges ${req.key.toUpperCase()} (${req.value}) ehhez a munkához`, 400);
    }
  }

  if (job.requirement) {
    const hasReq = (gf.achievements ?? []).some(
      (a) => a.name?.toLowerCase() === job.requirement.toLowerCase(),
    );
    if (!hasReq) {
      throw new HttpError(`Nincs meg a követelmény: ${job.requirement}`, 400);
    }
  }

  const existingProgress = await prisma.girlfriendJobProgress.findUnique({
    where: { girlfriendId_jobId: { girlfriendId: gf.id, jobId } },
  });
  const progressXp = existingProgress?.currentXp ?? 0;
  if ((job.entryLevelXp ?? 0) > progressXp) {
    throw new HttpError(
      `Nem kezdheted el ezt a munkát, legalább ${job.entryLevelXp} job XP kell hozzá`,
      400,
    );
  }

  await prisma.girlfriendJobProgress.upsert({
    where: { girlfriendId_jobId: { girlfriendId: gf.id, jobId } },
    update: {},
    create: { girlfriendId: gf.id, jobId },
  });

  return prisma.girlfriend.update({
    where: { id: gf.id },
    data: { jobs: { connect: { id: jobId } } },
    include: { jobs: true },
  });
};

export const unassignJobFromGirlfriend = async (userId, girlfriendId, jobId, isAdmin = false) => {
  const gf = await prisma.girlfriend.findFirst({
    where: isAdmin
      ? { id: girlfriendId }
      : { id: girlfriendId, character: { userId } },
  });
  if (!gf) throw new HttpError("Barátnő nem található vagy nincs jogosultság", 404);

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpError("Munka nem található", 404);

  return prisma.girlfriend.update({
    where: { id: gf.id },
    data: { jobs: { disconnect: { id: jobId } } },
    include: { jobs: true },
  });
};

export const getGirlfriendLiftCapacity = async (userId, girlfriendId, isAdmin = false) => {
  const gf = await prisma.girlfriend.findFirst({
    where: isAdmin
      ? { id: girlfriendId }
      : { id: girlfriendId, character: { userId } },
    include: { stats: { include: { measurement: true } } },
  });
  if (!gf) throw new HttpError("Barátnő nem található vagy nincs jogosultság", 404);

  const stats = await ensureStatsWithMeasurement(gf, true);
  const strLevel = stats?.str ?? 0;
  const gender = stats?.measurement?.gender;

  const baseCapacity =
    (await prisma.liftCapacity.findFirst({
      where: gender ? { gender } : {},
      orderBy: { strLevel: "asc" },
    })) || null;
  if (!baseCapacity) throw new HttpError("Nincs definiálva emelési adat", 404);
  const growth =
    (await prisma.liftGrowth.findFirst({
      where: gender ? { gender } : {},
    })) || {};
  const curlFactor = growth.bicepsCurlFactor || 1.15;
  const benchFactor = growth.benchPressFactor || 1.15;
  const squatFactor = growth.squatFactor || 1.15;
  const latFactor = growth.latPulldownFactor || 1.15;
  const curlScale = scaleLiftTier(strLevel, curlFactor, 1.2);
  const benchScale = scaleLiftTier(strLevel, benchFactor, 1.2);
  const squatScale = scaleLiftTier(strLevel, squatFactor, 1.2);
  const latScale = scaleLiftTier(strLevel, latFactor, 1.2);
  const capacity = {
    ...baseCapacity,
    bicepsCurl: baseCapacity.bicepsCurl ? Math.round(baseCapacity.bicepsCurl * curlScale * 10) / 10 : null,
    benchPress: baseCapacity.benchPress ? Math.round(baseCapacity.benchPress * benchScale * 10) / 10 : null,
    squat: baseCapacity.squat ? Math.round(baseCapacity.squat * squatScale * 10) / 10 : null,
    latPulldown: baseCapacity.latPulldown ? Math.round(baseCapacity.latPulldown * latScale * 10) / 10 : null,
  };

  return { girlfriendId, strLevel, gender, capacity, base: baseCapacity };
};

export const getGirlfriendEnduranceCapacity = async (userId, girlfriendId, isAdmin = false) => {
  const gf = await prisma.girlfriend.findFirst({
    where: isAdmin
      ? { id: girlfriendId }
      : { id: girlfriendId, character: { userId } },
    include: { stats: { include: { measurement: true } } },
  });
  if (!gf) throw new HttpError("Barátnő nem található vagy nincs jogosultság", 404);

  const stats = await ensureStatsWithMeasurement(gf, true);
  const staLevel = stats?.sta ?? 1;
  const gender = stats?.measurement?.gender;

  const baseEndurance =
    (await prisma.enduranceCapacity.findFirst({
      where: gender ? { gender } : {},
      orderBy: { staLevel: "asc" },
    })) || null;
  if (!baseEndurance) throw new HttpError("Nincs definiálva endurance adat", 404);
  const growth =
    (await prisma.enduranceGrowth.findFirst({
      where: gender ? { gender } : {},
    })) || {};
  const scale = Math.pow(growth.distanceFactor || 1.1, Math.max(0, staLevel - 1));
  const capacity = {
    distanceKm: baseEndurance.distanceKm ? Math.round(baseEndurance.distanceKm * scale * 10) / 10 : null,
    timeMinutes: baseEndurance.timeMinutes ? Math.round(baseEndurance.timeMinutes * scale * 10) / 10 : null,
  };
  const speedKmh = capacity.distanceKm ?? null;
  const baseSpeedKmh = baseEndurance.distanceKm ?? null;

  return {
    girlfriendId,
    staLevel,
    gender,
    capacity: { ...capacity, speedKmh },
    base: { ...baseEndurance, speedKmh: baseSpeedKmh },
  };
};

export const sleepAndLevelUpGirlfriend = async (userId, girlfriendId, isAdmin = false) => {
  const gf = await prisma.girlfriend.findFirst({
    where: isAdmin
      ? { id: girlfriendId }
      : { id: girlfriendId, character: { userId } },
    include: { stats: true },
  });
  if (!gf) throw new HttpError("Barátnő nem található vagy nincs jogosultság", 404);

  const stats = await ensureStatsWithMeasurement(gf, true);
  if (!stats) return gf;

  const types = [
    { type: "STR", levelKey: "str", xpKey: "currStrXp" },
    { type: "DEX", levelKey: "dex", xpKey: "currDexXp" },
    { type: "INT", levelKey: "int", xpKey: "currIntXp" },
    { type: "CHAR", levelKey: "char", xpKey: "currCharXp" },
    { type: "STA", levelKey: "sta", xpKey: "currStaXp" },
  ];

  const updates = {};

  for (const t of types) {
    const level = stats[t.levelKey] ?? 0;
    const xp = stats[t.xpKey] ?? 0;
    const req = await prisma.statRequirement.findUnique({
      where: { statType_level: { statType: t.type, level } },
    });
    const needed = req?.neededXp ?? 999;
    if (xp >= needed) {
      updates[t.levelKey] = level + 1;
      updates[t.xpKey] = 0;
    }
  }

  if (Object.keys(updates).length) {
    await prisma.stats.update({
      where: { id: stats.id },
      data: updates,
    });
  }

  await prisma.stats.update({
    where: { id: stats.id },
    data: { currentStamina: updates.sta ?? stats.sta ?? 1 },
  });

  // alvás 8 óra (480 perc) a barátnő saját idején
  const sleepDuration = 480;
  const advanced = advanceTime(gf.time ?? 0, sleepDuration, gf.day ?? "Monday");
  await prisma.girlfriend.update({
    where: { id: gf.id },
    data: { time: advanced.minutes, currentTime: advanced.formatted, day: advanced.day },
  });

  return getGirlfriend(userId, girlfriendId, { isAdmin: true, allowOrphan: true });
};
