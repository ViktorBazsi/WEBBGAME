import apiClient from "./apiClient.js";

export const fetchLocations = async () => {
  const { data } = await apiClient.get("/api/locations");
  return data;
};

export const createLocation = async (payload) => {
  const { data } = await apiClient.post("/api/locations", payload);
  return data;
};

export const updateLocation = async (id, payload) => {
  const { data } = await apiClient.patch(`/api/locations/${id}`, payload);
  return data;
};

export const deleteLocation = async (id) => {
  const { data } = await apiClient.delete(`/api/locations/${id}`);
  return data;
};

export const attachActivityToLocation = async (locationId, activityId) => {
  const { data } = await apiClient.post(`/api/locations/${locationId}/activities`, { activityId });
  return data;
};
