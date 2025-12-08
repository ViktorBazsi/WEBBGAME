import prisma from "../models/prisma-client.js";
import HttpError from "../utils/HttpError.js";

export const listLocations = () =>
  prisma.location.findMany({ include: { activity: true, characters: true, girlfriends: true } });

export const getLocation = async (id) => {
  const location = await prisma.location.findUnique({
    where: { id },
    include: { activity: true, characters: true, girlfriends: true },
  });
  if (!location) throw new HttpError("Helyszín nem található", 404);
  return location;
};

export const createLocation = (data) =>
  prisma.location.create({
    data,
    include: { activity: true, characters: true, girlfriends: true },
  });

export const updateLocation = async (id, data) => {
  await getLocation(id);
  return prisma.location.update({
    where: { id },
    data,
    include: { activity: true, characters: true, girlfriends: true },
  });
};

export const deleteLocation = async (id) => {
  await getLocation(id);
  await prisma.location.delete({ where: { id } });
  return true;
};
