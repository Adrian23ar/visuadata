<script setup>
// frontend/src/components/charts/LineChart.vue
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns'; // <-- IMPORTANTE: Importar el adaptador

// Registramos la escala de tiempo 'TimeScale' en lugar de las escalas normales
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, TimeScale);

defineProps({
  chartData: {
    type: Object,
    required: true,
  },
  chartOptions: {
    type: Object,
    default: () => ({
      responsive: true,
      maintainAspectRatio: false,
    }),
  },
});
</script>

<template>
  <Line :data="chartData" :options="chartOptions" />
</template>