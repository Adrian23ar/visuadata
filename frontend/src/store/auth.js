import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api'; // Importamos nuestro servicio de API

export const useAuthStore = defineStore('auth', () => {
  // --- STATE ---
  // Guardamos la información del usuario. `null` si no está logueado.
  const user = ref(null);

  // --- GETTERS ---
  // Un getter computado que nos dice si el usuario está autenticado.
  const isAuthenticated = computed(() => !!user.value);

  // --- ACTIONS ---

  // Acción para registrar un usuario
  async function register(credentials) {
    // Hacemos la petición a la API que construimos en el backend
    const response = await api.post('/auth/register', credentials);
    // Guardamos los datos del usuario en el state
    user.value = response.data;
  }

  // Acción para iniciar sesión
  async function login(credentials) {
    const response = await api.post('/auth/login', credentials);
    user.value = response.data;
  }

  // Acción para cerrar sesión
  async function logout() {
    await api.post('/auth/logout');
    // Limpiamos los datos del usuario del state
    user.value = null;
  }

  // (Futuro) Acción para verificar si ya hay una sesión activa al cargar la app
  async function checkAuthStatus() {
    try {
      // Crearemos este endpoint en el backend más adelante
      const response = await api.get('/auth/me');
      user.value = response.data;
    } catch (error) {
      user.value = null;
    }
  }


  return { user, isAuthenticated, register, login, logout, checkAuthStatus };
});