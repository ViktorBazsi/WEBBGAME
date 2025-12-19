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

export const listCharacters = async (userId) => {
  const chars = await prisma.character.findMany({
    where: { userId },
    include: {
      stats: { include: { measurement: true } },
      girlfriends: true,
      jobs: true,
      jobProgress: { include: { job: true } },
      location: true,
    },
  });
  const result = [];
  for (const c of chars) {
    if (c.stats && c.stats[0]) {
      c.stats[0] = await ensureStatsWithMeasurement(c, false);
    }
    result.push(c);
  }
  return result;
};

export const getCharacter = async (userId, id) => {
  const character = await prisma.character.findFirst({
    where: { id, userId },
    include: {
      stats: { include: { measurement: true } },
      girlfriends: true,
      jobs: true,
      jobProgress: { include: { job: true } },
      location: true,
    },
  });
  if (!character) throw new HttpError("Karakter nem található", 404);
  if (character.stats && character.stats[0]) {
    character.stats[0] = await ensureStatsWithMeasurement(character, false);
  }
  return character;
};

const setMeasurementForStats = async (statsId, strLevel = 1, gender) => {
  const m = await prisma.measurements.findFirst({
    where: gender ? { strLevel, gender } : { strLevel },
  });
  if (m) {
    await prisma.stats.update({
      where: { id: statsId },
      data: { measurementId: m.id },
    });
  }
};

const syncMeasurementForStats = async (statsRecord, gender) => {
  if (!statsRecord) return statsRecord;
  const strLevel = statsRecord.str ?? 1;
  const m = await prisma.measurements.findFirst({
    where: gender ? { strLevel, gender } : { strLevel },
  });
  if (m && statsRecord.measurementId !== m.id) {
    await prisma.stats.update({
      where: { id: statsRecord.id },
      data: { measurementId: m.id },
    });
    return { ...statsRecord, measurement: m };
  }
  return statsRecord;
};

export const createCharacter = async (userId, payload) => {
  const { name, gender = "MALE", stats, locationId } = payload;
  const data = {
    name,
    gender,
    userId,
    locationId: locationId || null,
    stats: stats
      ? {
          create: [stats],
        }
      : undefined,
  };
  const created = await prisma.character.create({
    data,
    include: { stats: true },
  });

  if (created.stats && created.stats.length) {
    const level = created.stats[0].str ?? 1;
    await setMeasurementForStats(created.stats[0].id, level, gender);
  }

  return getCharacter(userId, created.id);
};

const upsertMeasurementForStats = async (statsId, measurement = {}, gender, strLevelFallback = 1) => {
  const existing = await prisma.stats.findUnique({
    where: { id: statsId },
    select: { measurementId: true, str: true },
  });
  const targetStr = measurement.strLevel ?? existing?.str ?? strLevelFallback;
  if (existing?.measurementId) {
    await prisma.measurements.update({
      where: { id: existing.measurementId },
      data: { ...measurement, gender: measurement.gender ?? gender, strLevel: targetStr },
    });
    return existing.measurementId;
  }
  const created = await prisma.measurements.create({
    data: { ...measurement, gender: measurement.gender ?? gender, strLevel: targetStr },
  });
  await prisma.stats.update({
    where: { id: statsId },
    data: { measurementId: created.id },
  });
  return created.id;
};

export const updateCharacter = async (userId, id, payload, isAdmin = false) => {
  const existing = await prisma.character.findFirst({
    where: isAdmin ? { id } : { id, userId },
  });
  if (!existing) throw new HttpError("Karakter nem található", 404);

  const { stats, measurement, ...rest } = payload;

  const updated = await prisma.character.update({
    where: { id },
    data: rest,
    include: { stats: true, girlfriends: true, jobs: true, jobProgress: { include: { job: true } }, location: true },
  });

  if (stats && updated.stats.length) {
    const statsUpdate = { ...stats };
    if (stats.sta != null && stats.currentStamina == null) {
      statsUpdate.currentStamina = stats.sta;
    }
    await prisma.stats.update({
      where: { id: updated.stats[0].id },
      data: statsUpdate,
    });
    const level = stats.str ?? updated.stats[0].str ?? 1;
    await setMeasurementForStats(updated.stats[0].id, level, updated.gender);
    if (measurement) {
      await upsertMeasurementForStats(updated.stats[0].id, measurement, updated.gender);
    }
  } else if (stats) {
    await prisma.stats.create({
      data: { ...stats, characterId: updated.id },
    });
    const newStats = await prisma.stats.findFirst({
      where: { characterId: updated.id },
      orderBy: { createdAt: "desc" },
    });
    if (newStats) {
      const level = stats.str ?? 1;
      await setMeasurementForStats(newStats.id, level, updated.gender);
      if (measurement) {
        await upsertMeasurementForStats(newStats.id, measurement, updated.gender);
      }
    }
  } else if (measurement && updated.stats[0]) {
    await upsertMeasurementForStats(updated.stats[0].id, measurement, updated.gender);
  }

  return getCharacter(userId, id);
};

export const deleteCharacter = async (userId, id) => {
  const existing = await prisma.character.findFirst({ where: { id, userId } });
  if (!existing) throw new HttpError("Karakter nem található", 404);
  await prisma.character.delete({ where: { id } });
  return true;
};

export const assignJobToCharacter = async (userId, characterId, jobId, isAdmin) => {
  const character = await prisma.character.findFirst({
    where: isAdmin ? { id: characterId } : { id: characterId, userId },
    include: { stats: true, achievements: true },
  });
  if (!character) throw new HttpError("Karakter nem található", 404);

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpError("Munka nem található", 404);

  // stat követelmények
  const stats = character.stats?.[0];
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

  // achievement requirement
  if (job.requirement) {
    const hasReq = (character.achievements ?? []).some(
      (a) => a.name?.toLowerCase() === job.requirement.toLowerCase(),
    );
    if (!hasReq) {
      throw new HttpError(`Nincs meg a követelmény: ${job.requirement}`, 400);
    }
  }

  // entry level xp gate: meglévő progress kell hozzá
  const existingProgress = await prisma.characterJobProgress.findUnique({
    where: { characterId_jobId: { characterId, jobId } },
  });
  const progressXp = existingProgress?.currentXp ?? 0;
  if ((job.entryLevelXp ?? 0) > progressXp) {
    throw new HttpError(
      `Nem kezdheted el ezt a munkát, legalább ${job.entryLevelXp} job XP kell hozzá`,
      400,
    );
  }

  await prisma.characterJobProgress.upsert({
    where: { characterId_jobId: { characterId, jobId } },
    update: {},
    create: { characterId, jobId },
  });

  return prisma.character.update({
    where: { id: characterId },
    data: { jobs: { connect: { id: jobId } } },
    include: { jobs: true },
  });
};

export const unassignJobFromCharacter = async (userId, characterId, jobId, isAdmin = false) => {
  const character = await prisma.character.findFirst({
    where: isAdmin ? { id: characterId } : { id: characterId, userId },
  });
  if (!character) throw new HttpError("Karakter nem található", 404);

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpError("Munka nem található", 404);

  return prisma.character.update({
    where: { id: characterId },
    data: { jobs: { disconnect: { id: jobId } } },
    include: { jobs: true },
  });
};

export const getLiftCapacity = async (userId, characterId, isAdmin = false) => {
  const character = await prisma.character.findFirst({
    where: isAdmin ? { id: characterId } : { id: characterId, userId },
    include: { stats: { include: { measurement: true } } },
  });
  if (!character) throw new HttpError("Karakter nem található", 404);
  const stats = await ensureStatsWithMeasurement(character, false);
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
  const baseFactor = growth.bicepsCurlFactor || 1.15;
  const benchFactor = growth.benchPressFactor || 1.15;
  const squatFactor = growth.squatFactor || 1.15;
  const latFactor = growth.latPulldownFactor || 1.15;
  const scaleCurl = scaleLiftTier(strLevel, baseFactor, 1.2);
  const scaleBench = scaleLiftTier(strLevel, benchFactor, 1.2);
  const scaleSquat = scaleLiftTier(strLevel, squatFactor, 1.2);
  const scaleLat = scaleLiftTier(strLevel, latFactor, 1.2);
  const capacity = {
    ...baseCapacity,
    bicepsCurl: baseCapacity.bicepsCurl ? Math.round(baseCapacity.bicepsCurl * scaleCurl * 10) / 10 : null,
    benchPress: baseCapacity.benchPress ? Math.round(baseCapacity.benchPress * scaleBench * 10) / 10 : null,
    squat: baseCapacity.squat ? Math.round(baseCapacity.squat * scaleSquat * 10) / 10 : null,
    latPulldown: baseCapacity.latPulldown ? Math.round(baseCapacity.latPulldown * scaleLat * 10) / 10 : null,
  };

  return { characterId, strLevel, gender, capacity, base: baseCapacity };
};

export const getEnduranceCapacity = async (userId, characterId, isAdmin = false) => {
  const character = await prisma.character.findFirst({
    where: isAdmin ? { id: characterId } : { id: characterId, userId },
    include: { stats: { include: { measurement: true } } },
  });
  if (!character) throw new HttpError("Karakter nem található vagy nincs jogosultság", 404);
  const stats = await ensureStatsWithMeasurement(character, false);
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
    characterId,
    staLevel,
    gender,
    capacity: { ...capacity, speedKmh },
    base: { ...baseEndurance, speedKmh: baseSpeedKmh },
  };
};

export const sleepAndLevelUp = async (userId, characterId, isAdmin = false) => {
  const character = await prisma.character.findFirst({
    where: isAdmin ? { id: characterId } : { id: characterId, userId },
    include: { stats: true },
  });
  if (!character) throw new HttpError("Karakter nem található vagy nincs jogosultság", 404);

  const stats = await ensureStatsWithMeasurement(character, false);
  if (!stats) return character;

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
    // ha szintet léptünk STR-ben, frissítsük a measurement-et az új szinthez
    const newStrLevel = updates.str ?? stats.str ?? 1;
    await setMeasurementForStats(stats.id, newStrLevel, character.gender);
  }

  // stamina pool reset a szint szerinti maximumra
  await prisma.stats.update({
    where: { id: stats.id },
    data: { currentStamina: updates.sta ?? stats.sta ?? 1 },
  });

  // alvás 8 óra (480 perc)
  const sleepDuration = 480;
  const advanced = advanceTime(character.time, sleepDuration, character.day);
  await prisma.character.update({
    where: { id: character.id },
    data: { time: advanced.minutes, currentTime: advanced.formatted, day: advanced.day },
  });

  return getCharacter(userId, characterId);
};
