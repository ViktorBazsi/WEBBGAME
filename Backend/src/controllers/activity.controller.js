import {
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../services/activity.service.js";

export const getActivities = async (req, res, next) => {
  try {
    const data = await listActivities();
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const getActivityById = async (req, res, next) => {
  try {
    const data = await getActivity(req.params.id);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const postActivity = async (req, res, next) => {
  try {
    const data = await createActivity(req.body);
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
};

export const patchActivity = async (req, res, next) => {
  try {
    const data = await updateActivity(req.params.id, req.body);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const removeActivity = async (req, res, next) => {
  try {
    await deleteActivity(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
