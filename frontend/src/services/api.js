import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api', // Usa la variable de entorno
  withCredentials: true,
});

export default api;