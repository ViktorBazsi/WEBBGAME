import apiClient from "./apiClient.js";

export const fetchActivities = async () => {
  const { data } = await apiClient.get("/api/activities");
  return data;
};

export const createActivity = async (payload) => {
  const { data } = await apiClient.post("/api/activities", payload);
  return data;
};

export const updateActivity = async (id, payload) => {
  const { data } = await apiClient.patch(`/api/activities/${id}`, payload);
  return data;
};

export const deleteActivity = async (id) => {
  const { data } = await apiClient.delete(`/api/activities/${id}`);
  return data;
};

export const fetchSubActivities = async (activityId) => {
  const { data } = await apiClient.get(`/api/activities/${activityId}/subactivities`);
  return data;
};

export const createSubActivity = async (activityId, payload) => {
  const { data } = await apiClient.post(`/api/activities/${activityId}/subactivities`, payload);
  return data;
};

export const updateSubActivity = async (activityId, subId, payload) => {
  const { data } = await apiClient.patch(`/api/activities/${activityId}/subactivities/${subId}`, payload);
  return data;
};

export const deleteSubActivity = async (activityId, subId) => {
  const { data } = await apiClient.delete(`/api/activities/${activityId}/subactivities/${subId}`);
  return data;
};

export const executeSubActivity = async (characterId, subId, girlfriendId) => {
  const { data } = await apiClient.post(`/api/activities/${characterId}/subactivities/${subId}/execute`,
    girlfriendId ? { girlfriendId } : {}
  );
  return data;
};
