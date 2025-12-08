import prisma from "../models/prisma-client.js";
import HttpError from "../utils/HttpError.js";

const ensureCharacterOwnership = async (userId, characterId) => {
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId },
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

export const getGirlfriend = async (userId, id) => {
  const gf = await prisma.girlfriend.findFirst({
    where: { id, character: { userId } },
    include: { stats: true, character: true, jobs: true, location: true },
  });
  if (!gf) throw new HttpError("Barátnő nem található", 404);
  return gf;
};

export const createGirlfriend = async (userId, payload) => {
  const { name, characterId, stats, locationId } = payload;
  await ensureCharacterOwnership(userId, characterId);

  return prisma.girlfriend.create({
    data: {
      name,
      characterId,
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
  const gf = await getGirlfriend(userId, id);
  const { stats, characterId, ...rest } = payload;

  if (characterId && characterId !== gf.characterId) {
    await ensureCharacterOwnership(userId, characterId);
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
  await getGirlfriend(userId, id);
  await prisma.girlfriend.delete({ where: { id } });
  return true;
};

export const assignGirlfriendToCharacter = async (userId, girlfriendId, characterId) => {
  await ensureCharacterOwnership(userId, characterId);
  const gf = await getGirlfriend(userId, girlfriendId);
  return prisma.girlfriend.update({
    where: { id: gf.id },
    data: { characterId },
    include: { character: true, stats: true, jobs: true, location: true },
  });
};
