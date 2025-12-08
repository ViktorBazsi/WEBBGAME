import {
  listLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../services/location.service.js";

export const getLocations = async (req, res, next) => {
  try {
    const data = await listLocations();
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const getLocationById = async (req, res, next) => {
  try {
    const data = await getLocation(req.params.id);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const postLocation = async (req, res, next) => {
  try {
    const data = await createLocation(req.body);
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
};

export const patchLocation = async (req, res, next) => {
  try {
    const data = await updateLocation(req.params.id, req.body);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const removeLocation = async (req, res, next) => {
  try {
    await deleteLocation(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
