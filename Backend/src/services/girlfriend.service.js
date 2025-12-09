import prisma from "../models/prisma-client.js";
import HttpError from "../utils/HttpError.js";

const ensureCharacterOwnership = async (userId, characterId, isAdmin = false) => {
  const character = await prisma.character.findFirst({
    where: isAdmin ? { id: characterId } : { id: characterId, userId },
  });
  if (!character) throw new HttpError("Nincs jogosultság a karakterhez", 403);
  return character;
};

export const listGirlfriends = async (userId) => {
  return prisma.girlfriend.findMany({
    where: { character: { userId } },
    include: { stats: true, character: true, jobs: true, location: true },
  });
};

export const listAllGirlfriends = async () => {
  return prisma.girlfriend.findMany({
    include: { stats: true, character: true, jobs: true, location: true },
  });
};

export const listAvailableSingles = async () => {
  return prisma.girlfriend.findMany({
    where: { characterId: null },
    include: { stats: true, character: true, jobs: true, location: true },
  });
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
    include: { stats: true, character: true, jobs: true, location: true },
  });
  if (!gf) throw new HttpError("Barátnő nem található", 404);
  return gf;
};

export const createGirlfriend = async (userId, payload) => {
  const { name, characterId, stats, locationId } = payload;

  if (characterId) {
    await ensureCharacterOwnership(userId, characterId);
  }

  return prisma.girlfriend.create({
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
    include: { stats: true, character: true, jobs: true, location: true },
  });
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
  } else if (stats) {
    await prisma.stats.create({
      data: { ...stats, girlfriendId: gf.id },
    });
  }

  return getGirlfriend(userId, id);
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
    include: { character: true, stats: true, jobs: true, location: true },
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
