import prisma from "../models/prisma-client.js";
import HttpError from "../utils/HttpError.js";

export const listCharacters = async (userId) => {
  return prisma.character.findMany({
    where: { userId },
    include: { stats: true, girlfriends: true, jobs: true, location: true },
  });
};

export const getCharacter = async (userId, id) => {
  const character = await prisma.character.findFirst({
    where: { id, userId },
    include: { stats: true, girlfriends: true, jobs: true, location: true },
  });
  if (!character) throw new HttpError("Karakter nem található", 404);
  return character;
};

export const createCharacter = async (userId, payload) => {
  const { name, stats, locationId } = payload;
  const data = {
    name,
    userId,
    locationId: locationId || null,
    stats: stats
      ? {
          create: [stats],
        }
      : undefined,
  };
  return prisma.character.create({
    data,
    include: { stats: true, girlfriends: true, jobs: true, location: true },
  });
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
  } else if (stats) {
    await prisma.stats.create({
      data: { ...stats, characterId: updated.id },
    });
  }

  return getCharacter(userId, id);
};

export const deleteCharacter = async (userId, id) => {
  const existing = await prisma.character.findFirst({ where: { id, userId } });
  if (!existing) throw new HttpError("Karakter nem található", 404);
  await prisma.character.delete({ where: { id } });
  return true;
};
