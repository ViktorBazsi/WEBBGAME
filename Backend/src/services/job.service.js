import prisma from "../models/prisma-client.js";
import HttpError from "../utils/HttpError.js";

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
