import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorData = error.response?.data;
    const message =
      (typeof errorData === 'string' && errorData) ||
      errorData?.detail ||
      errorData?.title ||
      error.message ||
      'Erro inesperado na comunicação com o servidor';
      
    console.error(`[API Error ${error.response?.status || 'Network'}]:`, message);
    return Promise.reject(new Error(message));
  }
);

