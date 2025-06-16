<script setup>
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '../store/auth';

const name = ref('');
const email = ref('');
const password = ref('');
const errorMsg = ref(null);

const authStore = useAuthStore();
const router = useRouter();

const handleSubmit = async () => {
  errorMsg.value = null;
  if (password.value.length < 6) {
    errorMsg.value = 'La contraseña debe tener al menos 6 caracteres.';
    return;
  }
  try {
    await authStore.register({
      name: name.value,
      email: email.value,
      password: password.value,
    });
    router.push('/dashboard');
  } catch (error) {
    errorMsg.value = error.response?.data?.message || 'Ocurrió un error inesperado.';
  }
};
</script>

<template>
  <div class="w-full max-w-md p-8 space-y-6 bg-secondary-bg rounded-lg shadow-md">
    <h1 class="text-3xl font-bold text-center text-primary-text">Crear Cuenta</h1>
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div>
        <label for="name" class="block text-sm font-medium text-secondary-text">Nombre</label>
        <input v-model="name" type="text" id="name" required class="w-full px-3 py-2 mt-1 text-primary-text bg-primary-bg border border-secondary-accent rounded-md focus:outline-none focus:ring-2 focus:ring-primary-accent" />
      </div>
      <div>
        <label for="email" class="block text-sm font-medium text-secondary-text">Email</label>
        <input v-model="email" type="email" id="email" required class="w-full px-3 py-2 mt-1 text-primary-text bg-primary-bg border border-secondary-accent rounded-md focus:outline-none focus:ring-2 focus:ring-primary-accent" />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-secondary-text">Contraseña</label>
        <input v-model="password" type="password" id="password" required class="w-full px-3 py-2 mt-1 text-primary-text bg-primary-bg border border-secondary-accent rounded-md focus:outline-none focus:ring-2 focus:ring-primary-accent" />
      </div>
      <button type="submit" class="w-full py-2 font-bold text-white bg-primary-accent rounded-md hover:opacity-90 transition-opacity">
        Crear Cuenta
      </button>
       <div v-if="errorMsg" class="p-3 mt-4 text-center text-red-400 bg-red-900/20 rounded-md">
        {{ errorMsg }}
      </div>
    </form>
    <p class="text-sm text-center text-secondary-text">
      ¿Ya tienes una cuenta?
      <RouterLink to="/login" class="font-medium text-primary-accent hover:underline">Inicia Sesión</RouterLink>
    </p>
  </div>
</template>