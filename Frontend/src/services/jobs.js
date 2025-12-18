import apiClient from "./apiClient.js";

export const fetchJobs = async () => {
  const { data } = await apiClient.get("/api/jobs");
  return data;
};

export const createJob = async (payload) => {
  const { data } = await apiClient.post("/api/jobs", payload);
  return data;
};

export const updateJob = async (id, payload) => {
  const { data } = await apiClient.patch(`/api/jobs/${id}`, payload);
  return data;
};

export const deleteJob = async (id) => {
  const { data } = await apiClient.delete(`/api/jobs/${id}`);
  return data;
};
