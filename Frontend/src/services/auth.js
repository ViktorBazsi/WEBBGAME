import apiClient from "./apiClient.js";

export const loginUser = async (payload) => {
  const { data } = await apiClient.post("/api/auth/login", payload);
  return data;
};

export const registerUser = async (payload) => {
  const { data } = await apiClient.post("/api/auth/register", payload);
  return data;
};

export const getMe = async () => {
  const { data } = await apiClient.get("/api/auth/me");
  return data;
};
