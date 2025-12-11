import {
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  listSubActivities,
  createSubActivity,
  updateSubActivity,
  deleteSubActivity,
  executeSubActivity,
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
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Csak admin hozhat létre aktivitást" });
    }
    const data = await createActivity(req.body);
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
};

export const patchActivity = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Csak admin módosíthat aktivitást" });
    }
    const data = await updateActivity(req.params.id, req.body);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const removeActivity = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Csak admin törölhet aktivitást" });
    }
    await deleteActivity(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

// SubActivities
export const getSubActivities = async (req, res, next) => {
  try {
    const data = await listSubActivities(req.params.id);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const postSubActivity = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Csak admin hozhat létre sub-activity-t" });
    }
    const data = await createSubActivity(req.params.id, req.body);
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
};

export const patchSubActivity = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Csak admin módosíthat sub-activity-t" });
    }
    const data = await updateSubActivity(req.params.id, req.params.subId, req.body);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const removeSubActivity = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Csak admin törölhet sub-activity-t" });
    }
    await deleteSubActivity(req.params.id, req.params.subId);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

export const runSubActivity = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "ADMIN";
    const data = await executeSubActivity(
      req.user.id,
      req.params.charId,
      req.params.subId,
      isAdmin,
      req.body?.girlfriendId
    );
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};
