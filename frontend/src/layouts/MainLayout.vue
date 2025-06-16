<script setup>
// frontend/src/layouts/MainLayout.vue
import TheSidebar from '../components/TheSidebar.vue';
</script>

<template>
  <div class="flex h-screen bg-primary-bg text-primary-text w-full">
    <TheSidebar class="hidden md:flex flex-shrink-0" />
    <main class="flex-1 overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>