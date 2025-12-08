import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../models/prisma-client.js";
import HttpError from "../utils/HttpError.js";
import { JWT_SECRET } from "../constants/constants.js";

const TOKEN_EXPIRES_IN = "7d";
const SALT_ROUNDS = 5;

export const registerUser = async ({ username, email, password }) => {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });
  if (existing) {
    throw new HttpError("Username vagy email már foglalt", 409);
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { username, email, password: hashed },
  });

  const token = jwt.sign({ id: user.id }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });

  return { user, token };
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError("Hibás email vagy jelszó", 401);
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw new HttpError("Hibás email vagy jelszó", 401);
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });

  return { user, token };
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { characters: true },
  });
  if (!user) throw new HttpError("Felhasználó nem található", 404);
  return user;
};

export const updateUser = async (id, data) => {
  const { password, ...rest } = data;
  let updateData = { ...rest };

  if (password) {
    updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
  }

  try {
    return await prisma.user.update({
      where: { id },
      data: updateData,
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw new HttpError("Username vagy email már foglalt", 409);
    }
    throw err;
  }
};

export const deleteUser = async (id) => {
  await prisma.user.delete({ where: { id } });
  return true;
};

export const listUsers = async () => {
  return prisma.user.findMany({
    select: { id: true, username: true, email: true },
  });
};
