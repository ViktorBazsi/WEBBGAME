import {
  listGirlfriends,
  getGirlfriend,
  createGirlfriend,
  updateGirlfriend,
  deleteGirlfriend,
  assignGirlfriendToCharacter,
} from "../services/girlfriend.service.js";

export const getAllGirlfriends = async (req, res, next) => {
  try {
    const data = await listGirlfriends(req.user.id);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const getOneGirlfriend = async (req, res, next) => {
  try {
    const data = await getGirlfriend(req.user.id, req.params.id);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const postGirlfriend = async (req, res, next) => {
  try {
    const data = await createGirlfriend(req.user.id, req.body);
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
};

export const patchGirlfriend = async (req, res, next) => {
  try {
    const data = await updateGirlfriend(req.user.id, req.params.id, req.body);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const removeGirlfriend = async (req, res, next) => {
  try {
    await deleteGirlfriend(req.user.id, req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

export const attachGirlfriendToCharacter = async (req, res, next) => {
  try {
    const { characterId } = req.body;
    const data = await assignGirlfriendToCharacter(
      req.user.id,
      req.params.id,
      characterId
    );
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};
