import prisma from "../models/prisma-client.js";
import HttpError from "../utils/HttpError.js";

const ensureCharacterOwnership = async (userId, characterId, isAdmin = false) => {
  const character = await prisma.character.findFirst({
    where: isAdmin ? { id: characterId } : { id: characterId, userId },
  });
  if (!character) throw new HttpError("Nincs jogosultság a karakterhez", 403);
  return character;
};

const setMeasurementForStats = async (statsId, strLevel = 1, gender = "FEMALE") => {
  const m = await prisma.measurements.findFirst({ where: { strLevel, gender } });
  if (m) {
    await prisma.stats.update({
      where: { id: statsId },
      data: { measurementId: m.id },
    });
  }
};

const syncMeasurementForStats = async (statsRecord, gender = "FEMALE") => {
  if (!statsRecord) return statsRecord;
  const strLevel = statsRecord.str ?? 1;
  const m = await prisma.measurements.findFirst({ where: { strLevel, gender } });
  if (m && statsRecord.measurementId !== m.id) {
    await prisma.stats.update({
      where: { id: statsRecord.id },
      data: { measurementId: m.id },
    });
    return { ...statsRecord, measurement: m };
  }
  return statsRecord;
};

export const listGirlfriends = async (userId) => {
  const gfs = await prisma.girlfriend.findMany({
    where: { character: { userId } },
    include: { stats: { include: { measurement: true } }, character: true, jobs: true, location: true },
  });
  for (const g of gfs) {
    if (g.stats && g.stats[0]) {
      g.stats[0] = await syncMeasurementForStats(g.stats[0], g.gender ?? "FEMALE");
    }
  }
  return gfs;
};

export const listAllGirlfriends = async () => {
  const gfs = await prisma.girlfriend.findMany({
    include: { stats: { include: { measurement: true } }, character: true, jobs: true, location: true },
  });
  for (const g of gfs) {
    if (g.stats && g.stats[0]) {
      g.stats[0] = await syncMeasurementForStats(g.stats[0], g.gender ?? "FEMALE");
    }
  }
  return gfs;
};

export const listAvailableSingles = async () => {
  const gfs = await prisma.girlfriend.findMany({
    where: { characterId: null },
    include: { stats: { include: { measurement: true } }, character: true, jobs: true, location: true },
  });
  for (const g of gfs) {
    if (g.stats && g.stats[0]) {
      g.stats[0] = await syncMeasurementForStats(g.stats[0], g.gender ?? "FEMALE");
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
    include: { stats: { include: { measurement: true } }, character: true, jobs: true, location: true },
  });
  if (!gf) throw new HttpError("Barátnő nem található", 404);
  if (gf.stats && gf.stats[0]) {
    gf.stats[0] = await syncMeasurementForStats(gf.stats[0], gf.gender ?? "FEMALE");
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
    const level = created.stats[0].str ?? 1;
    await setMeasurementForStats(created.stats[0].id, level, "FEMALE");
  }

  return getGirlfriend(userId, created.id, { isAdmin: true, allowOrphan: true });
};

export const updateGirlfriend = async (userId, id, payload) => {
  const gf = await getGirlfriend(userId, id, { isAdmin: true });
  const { stats, characterId, ...rest } = payload;

  if (characterId && characterId !== gf.characterId) {
    await ensureCharacterOwnership(userId, characterId, true);
  }

  await prisma.girlfriend.update({
    where: { id },
    data: { ...rest, characterId: characterId || gf.characterId },
  });

  if (stats && gf.stats.length) {
    await prisma.stats.update({
      where: { id: gf.stats[0].id },
      data: stats,
    });
    const level = stats.str ?? gf.stats[0].str ?? 1;
    await setMeasurementForStats(gf.stats[0].id, level, "FEMALE");
  } else if (stats) {
    await prisma.stats.create({
      data: { ...stats, girlfriendId: gf.id },
    });
    const newStats = await prisma.stats.findFirst({
      where: { girlfriendId: gf.id },
      orderBy: { id: "desc" },
    });
    if (newStats) {
      const level = stats.str ?? 1;
      await setMeasurementForStats(newStats.id, level, "FEMALE");
    }
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
    include: { character: true },
  });
  if (!gf) throw new HttpError("Barátnő nem található vagy nincs jogosultság", 404);
  if (!gf.characterId) {
    throw new HttpError("A barátnő nincs karakterhez kötve", 400);
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new HttpError("Munka nem található", 404);

  return prisma.girlfriend.update({
    where: { id: gf.id },
    data: { jobs: { connect: { id: jobId } } },
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

  const stats = gf.stats[0];
  const strLevel = stats?.str ?? 0;
  const gender = stats?.measurement?.gender;

  const capacity = await prisma.liftCapacity.findFirst({
    where: { strLevel, gender },
  });
  if (!capacity) throw new HttpError("Nincs definiálva emelési adat erre a STR szintre", 404);

  return { girlfriendId, strLevel, gender, capacity };
};

export const sleepAndLevelUpGirlfriend = async (userId, girlfriendId, isAdmin = false) => {
  const gf = await prisma.girlfriend.findFirst({
    where: isAdmin
      ? { id: girlfriendId }
      : { id: girlfriendId, character: { userId } },
    include: { stats: true },
  });
  if (!gf) throw new HttpError("Barátnő nem található vagy nincs jogosultság", 404);

  const stats = gf.stats[0];
  if (!stats) return gf;

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
    // ha STR szintet léptünk, frissítsük a measurement-et az új szinthez (female)
    const newStrLevel = updates.str ?? stats.str ?? 1;
    await setMeasurementForStats(stats.id, newStrLevel, "FEMALE");
  }

  return getGirlfriend(userId, girlfriendId, { isAdmin: true, allowOrphan: true });
};
