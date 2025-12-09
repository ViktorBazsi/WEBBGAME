import { listJobs, getJob, createJob, updateJob, deleteJob } from "../services/job.service.js";

export const getJobs = async (req, res, next) => {
  try {
    const data = await listJobs();
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const getJobById = async (req, res, next) => {
  try {
    const data = await getJob(req.params.id);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const postJob = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Csak admin hozhat létre munkát" });
    }
    const data = await createJob(req.body);
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
};

export const patchJob = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Csak admin módosíthat munkát" });
    }
    const data = await updateJob(req.params.id, req.body);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const removeJob = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Csak admin törölhet munkát" });
    }
    await deleteJob(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
