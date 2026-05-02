const API = "https://task-manager-production-c9ad.up.railway.app";

const authHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": "Bearer " + localStorage.getItem("token"),
});

// ─── AUTH ───────────────────────────────────────────────
export const signup = async (data) => {
  const res = await fetch(API + "/api/signup/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const login = async (data) => {
  const res = await fetch(API + "/api/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getMe = async () => {
  const res = await fetch(API + "/api/me/", {
    headers: authHeaders(),
  });
  return res.json();
};

// ─── PROJECTS ───────────────────────────────────────────
export const createProject = async (data) => {
  const res = await fetch(API + "/api/projects/", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getProjects = async () => {
  const res = await fetch(API + "/api/projects/list/", {
    headers: authHeaders(),
  });
  return res.json();
};

export const getProjectDetail = async (id) => {
  const res = await fetch(API + `/api/projects/${id}/`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const updateProject = async (id, data) => {
  const res = await fetch(API + `/api/projects/${id}/update/`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteProject = async (id) => {
  const res = await fetch(API + `/api/projects/${id}/delete/`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
};

// ─── TASKS ──────────────────────────────────────────────
export const createTask = async (data) => {
  const res = await fetch(API + "/api/tasks/create/", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getTasks = async () => {
  const res = await fetch(API + "/api/tasks/", {
    headers: authHeaders(),
  });
  return res.json();
};

export const updateTask = async (id, data) => {
  const res = await fetch(API + `/api/tasks/${id}/update/`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteTask = async (id) => {
  const res = await fetch(API + `/api/tasks/${id}/delete/`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
};

// ─── USERS ──────────────────────────────────────────────
export const getUsers = async () => {
  const res = await fetch(API + "/api/users/", {
    headers: authHeaders(),
  });
  return res.json();
};

// ─── DASHBOARD ──────────────────────────────────────────
export const getDashboardStats = async () => {
  const res = await fetch(API + "/api/dashboard/", {
    headers: authHeaders(),
  });
  return res.json();
};