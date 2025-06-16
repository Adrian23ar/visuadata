import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // La URL base de nuestro backend
  withCredentials: true, // ¡MUY IMPORTANTE! Permite que axios envíe la cookie de autenticación en cada petición.
});

export default api;