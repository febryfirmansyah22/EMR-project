import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const TOKEN_KEY = "klinik_token";

export const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove(TOKEN_KEY);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const setToken = (token: string) => {
  Cookies.set(TOKEN_KEY, token, {
    expires: 7,
    secure: false,
    sameSite: "lax",
  });
};

export const removeToken = () => {
  Cookies.remove(TOKEN_KEY);
};

export const getToken = () => Cookies.get(TOKEN_KEY);

// ============================================================
// Auth API
// ============================================================
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// ============================================================
// Observasi API
// ============================================================
export const observasiApi = {
  list: (params?: Record<string, unknown>) =>
    api.get("/observasi", { params }),
  get: (id: number) => api.get(`/observasi/${id}`),
  create: (data: Record<string, unknown>) => api.post("/observasi", data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/observasi/${id}`, data),
  delete: (id: number) => api.delete(`/observasi/${id}`),
  summary: (params?: Record<string, unknown>) =>
    api.get("/observasi/summary", { params }),
  export: (params?: Record<string, unknown>) =>
    api.get("/observasi/export", { params, responseType: "blob" }),
};

// ============================================================
// Cream API
// ============================================================
export const creamApi = {
  list: (params?: Record<string, unknown>) => api.get("/cream", { params }),
  get: (id: number) => api.get(`/cream/${id}`),
  create: (data: Record<string, unknown>) => api.post("/cream", data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/cream/${id}`, data),
  delete: (id: number) => api.delete(`/cream/${id}`),
  summary: (params?: Record<string, unknown>) =>
    api.get("/cream/summary", { params }),
  export: (params?: Record<string, unknown>) =>
    api.get("/cream/export", { params, responseType: "blob" }),
};

// ============================================================
// Faktur API
// ============================================================
export const fakturApi = {
  list: (params?: Record<string, unknown>) => api.get("/faktur", { params }),
  get: (id: number) => api.get(`/faktur/${id}`),
  create: (data: Record<string, unknown>) => api.post("/faktur", data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/faktur/${id}`, data),
  delete: (id: number) => api.delete(`/faktur/${id}`),
  summary: (params?: Record<string, unknown>) =>
    api.get("/faktur/summary", { params }),
  export: (params?: Record<string, unknown>) =>
    api.get("/faktur/export", { params, responseType: "blob" }),
};

// ============================================================
// Setoran API
// ============================================================
export const setoranApi = {
  list: (params?: Record<string, unknown>) => api.get("/setoran", { params }),
  get: (id: number) => api.get(`/setoran/${id}`),
  create: (data: Record<string, unknown>) => api.post("/setoran", data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/setoran/${id}`, data),
  delete: (id: number) => api.delete(`/setoran/${id}`),
};

// ============================================================
// Dashboard API
// ============================================================
export const dashboardApi = {
  stats: (params?: Record<string, unknown>) =>
    api.get("/dashboard/stats", { params }),
  charts: (params?: Record<string, unknown>) =>
    api.get("/dashboard/charts", { params }),
};

// ============================================================
// Rekap API
// ============================================================
export const rekapApi = {
  mingguan: (params?: Record<string, unknown>) =>
    api.get("/rekap/mingguan", { params }),
  bulanan: (params?: Record<string, unknown>) =>
    api.get("/rekap/bulanan", { params }),
};

// ============================================================
// Users API
// ============================================================
export const usersApi = {
  list: (params?: Record<string, unknown>) => api.get("/users", { params }),
  get: (id: number) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post("/users", data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// ============================================================
// Aktivitas API
// ============================================================
export const aktivitasApi = {
  list: (params?: Record<string, unknown>) =>
    api.get("/aktivitas", { params }),
};
