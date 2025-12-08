import prisma from "../models/prisma-client.js";
import HttpError from "../utils/HttpError.js";

export const listActivities = () => prisma.activity.findMany({ include: { location: true } });

export const getActivity = async (id) => {
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: { location: true },
  });
  if (!activity) throw new HttpError("Activity nem található", 404);
  return activity;
};

export const createActivity = (data) =>
  prisma.activity.create({ data, include: { location: true } });

export const updateActivity = async (id, data) => {
  await getActivity(id);
  return prisma.activity.update({
    where: { id },
    data,
    include: { location: true },
  });
};

export const deleteActivity = async (id) => {
  await getActivity(id);
  await prisma.activity.delete({ where: { id } });
  return true;
};
