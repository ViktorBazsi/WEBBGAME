import apiClient from "./apiClient.js";

export const fetchGirlfriends = async () => {
  const { data } = await apiClient.get("/api/girlfriends");
  return data;
};

export const createGirlfriend = async (payload) => {
  const { data } = await apiClient.post("/api/girlfriends", payload);
  return data;
};

export const updateGirlfriend = async (id, payload) => {
  const { data } = await apiClient.patch(`/api/girlfriends/${id}`, payload);
  return data;
};

export const deleteGirlfriend = async (id) => {
  const { data } = await apiClient.delete(`/api/girlfriends/${id}`);
  return data;
};
