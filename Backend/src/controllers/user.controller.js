import { getUserById, updateUser, deleteUser, listUsers } from "../services/user.service.js";

export const listAllUsers = async (req, res, next) => {
  try {
    const users = await listUsers();
    return res.json(users);
  } catch (err) {
    return next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);
    return res.json(user);
  } catch (err) {
    return next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updated = await updateUser(req.user.id, req.body);
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
};

export const deleteProfile = async (req, res, next) => {
  try {
    await deleteUser(req.user.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
