<script setup>
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { ChartPieIcon, TableCellsIcon, ArrowLeftEndOnRectangleIcon } from '@heroicons/vue/24/solid';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<template>
  <aside class="w-60 bg-secondary-bg flex flex-col p-4">
    <div class="flex items-center gap-2 px-2 mb-10">
        <svg class="h-8 w-8 text-primary-accent" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4v16h16V4H4zm14 14H6V6h12v12zM8 10h2v6H8v-6zm4 0h2v6h-2v-6zm4-3h2v9h-2V7z" fill="currentColor"/></svg>
        <h1 class="text-2xl font-bold text-primary-text">VisuaData</h1>
    </div>

    <nav class="flex-1 flex flex-col gap-2">
        <RouterLink to="/dashboard" class="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-primary-accent hover:text-white transition-colors" active-class="bg-primary-accent text-white">
            <ChartPieIcon class="h-6 w-6" />
            <span class="font-semibold">Dashboard</span>
        </RouterLink>
        <RouterLink to="/datasets" class="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-primary-accent hover:text-white transition-colors" active-class="bg-primary-accent text-white">
            <TableCellsIcon class="h-6 w-6" />
            <span class="font-semibold">Datasets</span>
        </RouterLink>
    </nav>

    <div class="mt-auto">
        <button @click="handleLogout" class="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors">
            <ArrowLeftEndOnRectangleIcon class="h-6 w-6" />
            <span class="font-semibold">Cerrar Sesión</span>
        </button>
    </div>
  </aside>
</template>