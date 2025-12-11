import prisma from "../models/prisma-client.js";
import HttpError from "../utils/HttpError.js";

export const listCharacters = async (userId) => {
  const chars = await prisma.character.findMany({
    where: { userId },
    include: {
      stats: { include: { measurement: true } },
      girlfriends: true,
      jobs: true,
      location: true,
    },
  });
  for (const c of chars) {
    if (c.stats && c.stats[0]) {
      c.stats[0] = await syncMeasurementForStats(c.stats[0], c.gender);
    }
  }
  return chars;
};

export const getCharacter = async (userId, id) => {
  const character = await prisma.character.findFirst({
    where: { id, userId },
    include: {
      stats: { include: { measurement: true } },
      girlfriends: true,
      jobs: true,
      location: true,
    },
  });
  if (!character) throw new HttpError("Karakter nem található", 404);
  if (character.stats && character.stats[0]) {
    character.stats[0] = await syncMeasurementForStats(character.stats[0], character.gender);
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

export const updateCharacter = async (userId, id, payload) => {
  const existing = await prisma.character.findFirst({ where: { id, userId } });
  if (!existing) throw new HttpError("Karakter nem található", 404);

  const { stats, ...rest } = payload;

  const updated = await prisma.character.update({
    where: { id },
    data: rest,
    include: { stats: true, girlfriends: true, jobs: true, location: true },
  });

  if (stats && updated.stats.length) {
    await prisma.stats.update({
      where: { id: updated.stats[0].id },
      data: stats,
    });
    const level = stats.str ?? updated.stats[0].str ?? 1;
    await setMeasurementForStats(updated.stats[0].id, level, updated.gender);
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
    }
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
  });
  if (!character) throw new HttpError("Karakter nem található", 404);

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpError("Munka nem található", 404);

  return prisma.character.update({
    where: { id: characterId },
    data: { jobs: { connect: { id: jobId } } },
    include: { jobs: true },
  });
};

export const getLiftCapacity = async (userId, characterId, isAdmin = false) => {
  const character = await prisma.character.findFirst({
    where: isAdmin ? { id: characterId } : { id: characterId, userId },
    include: { stats: { include: { measurement: true } } },
  });
  if (!character) throw new HttpError("Karakter nem található", 404);
  const stats = character.stats[0];
  const strLevel = stats?.str ?? 0;
  const gender = stats?.measurement?.gender;

  const capacity = await prisma.liftCapacity.findFirst({
    where: { strLevel, gender },
  });
  if (!capacity) throw new HttpError("Nincs definiálva emelési adat erre a STR szintre", 404);

  return { characterId, strLevel, gender, capacity };
};

export const sleepAndLevelUp = async (userId, characterId, isAdmin = false) => {
  const character = await prisma.character.findFirst({
    where: isAdmin ? { id: characterId } : { id: characterId, userId },
    include: { stats: true },
  });
  if (!character) throw new HttpError("Karakter nem található vagy nincs jogosultság", 404);

  const stats = character.stats[0];
  if (!stats) return character;

  const types = [
    { type: "STR", levelKey: "str", xpKey: "currStrXp" },
    { type: "DEX", levelKey: "dex", xpKey: "currDexXp" },
    { type: "INT", levelKey: "int", xpKey: "currIntXp" },
    { type: "CHAR", levelKey: "char", xpKey: "currCharXp" },
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

  return getCharacter(userId, characterId);
};
