import HttpError from "../utils/HttpError.js";
import {
  attachImageToEntity,
  deleteImageFromEntity,
  getImagesForEntity,
  deleteSubActivityImage,
  getSubActivityImage,
  uploadSubActivityImage,
} from "../services/upload.service.js";

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new HttpError("Hiányzik a kép fájl (image field)", 400);
    }
    const { entity, id } = req.params;
    const stage = req.body.stage ?? req.query.stage;

    const payload = await attachImageToEntity({
      entity,
      id,
      stage: stage != null ? Number(stage) : undefined,
      user: req.user,
      file: req.file,
    });

    return res.status(201).json(payload);
  } catch (err) {
    return next(err);
  }
};

export const getImages = async (req, res, next) => {
  try {
    const { entity, id } = req.params;
    const payload = await getImagesForEntity({ entity, id, user: req.user });
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
};

export const deleteImage = async (req, res, next) => {
  try {
    const { entity, id } = req.params;
    const stage = req.body?.stage ?? req.query?.stage;
    const payload = await deleteImageFromEntity({
      entity,
      id,
      stage: stage != null ? Number(stage) : undefined,
      user: req.user,
    });
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
};

export const uploadSubActivityImageForTarget = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new HttpError("Hiányzik a kép fájl (image field)", 400);
    }
    const { subId } = req.params;
    const payload = await uploadSubActivityImage({
      subActivityId: subId,
      targetType: req.body?.targetType ?? req.query?.targetType,
      targetId: req.body?.targetId ?? req.query?.targetId,
      strLevel: req.body?.strLevel ?? req.query?.strLevel,
      user: req.user,
      file: req.file,
    });
    return res.status(201).json(payload);
  } catch (err) {
    return next(err);
  }
};

export const getSubActivityImageForTarget = async (req, res, next) => {
  try {
    const { subId } = req.params;
    const payload = await getSubActivityImage({
      subActivityId: subId,
      targetType: req.query?.targetType ?? req.body?.targetType,
      targetId: req.query?.targetId ?? req.body?.targetId,
      strLevel: req.query?.strLevel ?? req.body?.strLevel,
      user: req.user,
    });
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
};

export const deleteSubActivityImageForTarget = async (req, res, next) => {
  try {
    const { subId } = req.params;
    const payload = await deleteSubActivityImage({
      subActivityId: subId,
      targetType: req.body?.targetType ?? req.query?.targetType,
      targetId: req.body?.targetId ?? req.query?.targetId,
      strLevel: req.body?.strLevel ?? req.query?.strLevel,
      user: req.user,
    });
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
};
