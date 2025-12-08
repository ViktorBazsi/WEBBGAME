import {
  registerUser,
  loginUser,
  getUserById,
} from "../services/user.service.js";

export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const { user, token } = await registerUser({ username, email, password });
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser({ email, password });
    return res.json({ user, token });
  } catch (err) {
    return next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);
    return res.json(user);
  } catch (err) {
    return next(err);
  }
};
