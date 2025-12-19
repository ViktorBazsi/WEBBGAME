import apiClient from "./apiClient.js";

export const fetchCharacters = async () => {
  const { data } = await apiClient.get("/api/characters");
  return data;
};

export const createCharacter = async (payload) => {
  const { data } = await apiClient.post("/api/characters", payload);
  return data;
};

export const updateCharacter = async (id, payload) => {
  const { data } = await apiClient.patch(`/api/characters/${id}`, payload);
  return data;
};

export const deleteCharacter = async (id) => {
  const { data } = await apiClient.delete(`/api/characters/${id}`);
  return data;
};

export const fetchCharacterLifts = async (id) => {
  const { data } = await apiClient.get(`/api/characters/${id}/lifts`);
  return data;
};

export const fetchCharacterEndurance = async (id) => {
  const { data } = await apiClient.get(`/api/characters/${id}/endurance`);
  return data;
};
