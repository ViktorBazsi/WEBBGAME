import {
  listGirlfriends,
  listAllGirlfriends,
  getGirlfriend,
  createGirlfriend,
  updateGirlfriend,
  deleteGirlfriend,
  assignGirlfriendToCharacter,
  assignJobToGirlfriend,
  getGirlfriendLiftCapacity,
  sleepAndLevelUpGirlfriend,
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
    const isAdmin = req.user.role === "ADMIN";
    // Engedjük lekérni az orphan (characterId null) barátnőket is, hogy ki lehessen választani őket.
    const data = await getGirlfriend(req.user.id, req.params.id, { allowOrphan: true, isAdmin });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const postGirlfriend = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Csak admin hozhat létre új barátnőt" });
    }
    const data = await createGirlfriend(req.user.id, req.body);
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
};

export const patchGirlfriend = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Csak admin módosíthat barátnőt" });
    }
    const data = await updateGirlfriend(req.user.id, req.params.id, req.body);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const removeGirlfriend = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Csak admin törölhet barátnőt" });
    }
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

export const getAllGirlfriendsAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Csak admin listázhat minden barátnőt" });
    }
    const data = await listAllGirlfriends();
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const addJobForGirlfriend = async (req, res, next) => {
  try {
    const { jobId } = req.body;
    const isAdmin = req.user.role === "ADMIN";
    const data = await assignJobToGirlfriend(req.user.id, req.params.id, jobId, isAdmin);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const getGirlfriendLifts = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "ADMIN";
    const data = await getGirlfriendLiftCapacity(req.user.id, req.params.id, isAdmin);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

export const sleepGirlfriend = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "ADMIN";
    const data = await sleepAndLevelUpGirlfriend(req.user.id, req.params.id, isAdmin);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};
