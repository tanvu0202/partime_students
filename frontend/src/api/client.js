import axios from 'axios';

// Địa chỉ backend. Có thể đổi bằng file frontend/.env: VITE_API_URL=http://localhost:8080
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const TOKEN_KEY = 'gr7_token';
const USER_KEY = 'gr7_user';

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  },
  save: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

const client = axios.create({ baseURL: API_URL });

// Tự gắn "Authorization: Bearer <token>" vào mọi request (B6-07)
client.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token sai / hết hạn -> xóa phiên và quay về trang đăng nhập
client.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLoginCall = error.config?.url?.includes('/api/auth/login');
    if (error.response?.status === 401 && !isLoginCall) {
      storage.clear();
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Lấy thông báo lỗi từ JSON { status, message, errors } của backend
export function errorMessage(error) {
  return error.response?.data?.message || 'Không kết nối được máy chủ, kiểm tra backend đã chạy chưa';
}
export function fieldErrors(error) {
  return error.response?.data?.errors || {};
}

export default client;
