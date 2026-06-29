import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const loginApi = async (credentials) => {
  const response = await api.post('/login', credentials);
  if (response.data.success) {
    localStorage.setItem('auth_token', response.data.token);
    localStorage.setItem('auth_user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const logoutApi = async () => {
  try {
    await api.post('/logout');
  } finally {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};

export default api;
