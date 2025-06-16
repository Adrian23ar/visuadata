<script setup>
defineProps({
  show: Boolean,
  title: String,
  message: String,
});
const emit = defineEmits(['confirm', 'cancel']);
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
    <div class="bg-secondary-bg rounded-lg shadow-xl p-8 max-w-sm w-full">
      <h2 class="text-2xl font-bold text-primary-text mb-4">{{ title }}</h2>
      <p class="text-secondary-text mb-6">{{ message }}</p>
      <div class="flex justify-end space-x-4">
        <button @click="emit('cancel')" class="px-6 py-2 font-semibold text-primary-text bg-secondary-accent rounded-md hover:opacity-80">
          Cancelar
        </button>
        <button @click="emit('confirm')" class="px-6 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">
          Confirmar
        </button>
      </div>
    </div>
  </div>
</template>