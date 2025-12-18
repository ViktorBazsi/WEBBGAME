import apiClient from "./apiClient.js";

export const uploadEntityImage = async (entity, id, file, stage) => {
  const form = new FormData();
  form.append("image", file);
  const query = stage ? `?stage=${stage}` : "";
  const { data } = await apiClient.post(`/api/uploads/${entity}/${id}${query}`, form);
  return data;
};

export const deleteEntityImage = async (entity, id, stage) => {
  const query = stage ? `?stage=${stage}` : "";
  const { data } = await apiClient.delete(`/api/uploads/${entity}/${id}${query}`);
  return data;
};

export const uploadSubActivityImage = async (subId, payload, file) => {
  const form = new FormData();
  form.append("image", file);
  const params = new URLSearchParams(payload).toString();
  const { data } = await apiClient.post(`/api/uploads/subactivities/${subId}/images?${params}`, form);
  return data;
};

export const deleteSubActivityImage = async (subId, payload) => {
  const params = new URLSearchParams(payload).toString();
  const { data } = await apiClient.delete(`/api/uploads/subactivities/${subId}/images?${params}`);
  return data;
};
