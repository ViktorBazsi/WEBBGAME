import {
  listCharacters,
  getCharacter,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  assignJobToCharacter,
} from "../services/character.service.js";

export const getAllCharacters = async (req, res, next) => {
  try {
    const characters = await listCharacters(req.user.id);
    return res.json(characters);
  } catch (err) {
    return next(err);
  }
};

export const getOneCharacter = async (req, res, next) => {
  try {
    const character = await getCharacter(req.user.id, req.params.id);
    return res.json(character);
  } catch (err) {
    return next(err);
  }
};

export const postCharacter = async (req, res, next) => {
  try {
    const character = await createCharacter(req.user.id, req.body);
    return res.status(201).json(character);
  } catch (err) {
    return next(err);
  }
};

export const patchCharacter = async (req, res, next) => {
  try {
    const character = await updateCharacter(req.user.id, req.params.id, req.body);
    return res.json(character);
  } catch (err) {
    return next(err);
  }
};

export const removeCharacter = async (req, res, next) => {
  try {
    await deleteCharacter(req.user.id, req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

export const addJobForCharacter = async (req, res, next) => {
  try {
    const { jobId } = req.body;
    const isAdmin = req.user?.role === "ADMIN";
    const data = await assignJobToCharacter(req.user.id, req.params.id, jobId, isAdmin);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};
