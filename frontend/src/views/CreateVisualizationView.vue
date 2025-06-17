<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import api from '../services/api';
import BarChart from '../components/charts/BarChart.vue';
import LineChart from '../components/charts/LineChart.vue';
import DataTable from '../components/charts/Datatable.vue';
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';

// --- Estado del Componente ---
const route = useRoute();
const dataset = ref(null);
const datasetColumns = ref([]);
const errorMsg = ref(null);
const successMsg = ref(null);
const vizName = ref('');
const chartType = ref('bar');
const labelColumn = ref('');
const dataColumn = ref('');

// --- Carga de Datos ---
onMounted(async () => {
  const datasetId = route.params.datasetId;
  if (datasetId) {
    try {
      const response = await api.get(`/datasets/${datasetId}`);
      dataset.value = response.data;
      let parsedData = typeof response.data.data_json === 'string'
        ? JSON.parse(response.data.data_json)
        : response.data.data_json;
      dataset.value.data = parsedData;
      if (parsedData && parsedData.length > 0) {
        datasetColumns.value = Object.keys(parsedData[0]);
      }
    } catch (e) {
      errorMsg.value = 'No se pudo cargar el dataset.';
    }
  }
});

// --- Funciones Helper ---
const formatDateForLabel = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return 'Invalid Date';
  const parts = dateString.split('/');
  if (parts.length !== 3) return dateString;
  const [day, month, year] = parts;
  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const parseDateForChart = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return `${year}-${month}-${day}`;
};

// --- Computed Properties para Gráficos (LÓGICA HÍBRIDA FINAL) ---
const chartData = computed(() => {
  if (!dataset.value?.data || !labelColumn.value || !dataColumn.value) {
    return { labels: [], datasets: [] };
  }
  const isTimeSeries = ['fecha_valor', 'fecha_operacion'].includes(labelColumn.value);

  // LÓGICA PARA GRÁFICO DE LÍNEAS (usa escala de tiempo)
  if (chartType.value === 'line' && isTimeSeries) {
    // Aseguramos orden ascendente para la línea
    const sortedData = [...dataset.value.data].sort((a, b) => new Date(parseDateForChart(a[labelColumn.value])) - new Date(parseDateForChart(b[labelColumn.value])));
    return {
      datasets: [{
        label: dataColumn.value, backgroundColor: '#00C896', borderColor: '#00C896',
        data: sortedData.map(item => ({ x: parseDateForChart(item[labelColumn.value]), y: parseFloat(item[dataColumn.value]) || 0 })),
      }]
    };
  }

  // LÓGICA PARA GRÁFICO DE BARRAS y otros (usa escala de categoría)
  // Ordenamos los datos para que el gráfico de barras también se muestre cronológicamente
  const dataForCategoryChart = [...dataset.value.data].sort((a, b) => {
    if (isTimeSeries) {
      return new Date(parseDateForChart(a[labelColumn.value])) - new Date(parseDateForChart(b[labelColumn.value]));
    }
    return 0; // No ordenar si no es una serie de tiempo
  });

  return {
    labels: dataForCategoryChart.map(item => isTimeSeries ? formatDateForLabel(item[labelColumn.value]) : item[labelColumn.value]),
    datasets: [{
      label: dataColumn.value, backgroundColor: '#00C896',
      data: dataForCategoryChart.map(item => parseFloat(item[dataColumn.value]) || 0),
    }]
  };
});

const chartOptions = computed(() => {
  const isTimeSeries = ['fecha_valor', 'fecha_operacion'].includes(labelColumn.value);

  // Opciones para Gráfico de Líneas con Eje de Tiempo
  if (chartType.value === 'line' && isTimeSeries) {
    return {
      responsive: true, maintainAspectRatio: false,
      scales: { x: { type: 'time', time: { unit: 'day', tooltipFormat: 'dd/MM/yyyy', displayFormats: { day: 'MMM d' } }, distribution: 'series' } }
    };
  }

  // Opciones para Gráfico de Barras con Eje de Tiempo (Tooltip personalizado)
  if (chartType.value === 'bar' && isTimeSeries) {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            title: function (tooltipItems) {
              const index = tooltipItems[0].dataIndex;
              const sortedData = [...dataset.value.data].sort((a, b) => new Date(parseDateForChart(a[labelColumn.value])) - new Date(parseDateForChart(b[labelColumn.value])));
              const originalDataItem = sortedData[index];
              return originalDataItem ? originalDataItem[labelColumn.value] : '';
            }
          }
        }
      }
    };
  }

  // Opciones por defecto para todos los demás casos
  return { responsive: true, maintainAspectRatio: false };
});

// --- NUEVA COMPUTED PROPERTY PARA ORDENAR LOS DATOS DE LA TABLA ---
const tableData = computed(() => {
  // Simplemente devuelve los datos como vienen, ya que ahora el backend los ordena por nosotros.
  return dataset.value?.data || [];
});

const handleSaveVisualization = async () => {
  errorMsg.value = null;
  successMsg.value = null;
  if (!vizName.value || !labelColumn.value || !dataColumn.value) {
    errorMsg.value = "Por favor, completa toda la configuración.";
    return;
  }
  try {
    const config = { labelColumn: labelColumn.value, dataColumn: dataColumn.value };
    await api.post('/visualizations/create', {
      name: vizName.value,
      chart_type: chartType.value,
      dataset_id: dataset.value.id,
      config: config
    });
    successMsg.value = "¡Visualización guardada con éxito!";
  } catch (e) {
    errorMsg.value = "No se pudo guardar la visualización.";
  }
};
</script>

<template>
  <div class="w-full mx-auto p-8 text-primary-text">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-4xl font-bold">Crear Nueva Visualización</h1>
      <RouterLink to="/datasets"
        class="flex items-center gap-2 px-4 py-2 font-bold text-white bg-secondary-accent rounded-lg hover:opacity-80 transition-opacity">
        <ArrowLeftIcon class="h-5 w-5" />
        Volver al Gestor
      </RouterLink>
    </div>
    <p v-if="dataset" class="text-secondary-text mb-8">Usando el dataset: <span class="font-bold text-primary-accent">{{
      dataset.file_name }}</span></p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="md:col-span-1 bg-secondary-bg p-6 rounded-lg shadow-lg space-y-6">
        <h2 class="text-2xl font-semibold">Configuración</h2>
        <div>
          <label for="vizName" class="block text-sm font-medium text-secondary-text">Nombre de la Visualización</label>
          <input v-model="vizName" type="text" id="vizName"
            class="w-full px-3 py-2 mt-1 text-primary-text bg-primary-bg border border-secondary-accent rounded-md">
        </div>
        <div>
          <label for="chartType" class="block text-sm font-medium text-secondary-text">Tipo de Gráfico</label>
          <select v-model="chartType" id="chartType"
            class="w-full px-3 py-2 mt-1 text-primary-text bg-primary-bg border border-secondary-accent rounded-md">
            <option value="bar">Barras</option>
            <option value="line">Líneas</option>
            <option value="table">Tabla</option>
          </select>
        </div>
        <div>
          <label for="labelColumn" class="block text-sm font-medium text-secondary-text">Eje de Etiquetas (Eje
            X)</label>
          <select v-model="labelColumn" id="labelColumn"
            class="w-full px-3 py-2 mt-1 text-primary-text bg-primary-bg border border-secondary-accent rounded-md">
            <option disabled value="">Selecciona una columna</option>
            <option v-for="col in datasetColumns" :key="col" :value="col">{{ col }}</option>
          </select>
        </div>
        <div>
          <label for="dataColumn" class="block text-sm font-medium text-secondary-text">Eje de Datos (Eje Y)</label>
          <select v-model="dataColumn" id="dataColumn"
            class="w-full px-3 py-2 mt-1 text-primary-text bg-primary-bg border border-secondary-accent rounded-md">
            <option disabled value="">Selecciona una columna</option>
            <option v-for="col in datasetColumns" :key="col" :value="col">{{ col }}</option>
          </select>
        </div>
        <button @click="handleSaveVisualization"
          class="w-full py-2 font-bold text-white bg-primary-accent rounded-lg hover:opacity-90 transition-opacity">Guardar
          Visualización</button>
        <p v-if="successMsg" class="text-green-400 mt-2 text-center">{{ successMsg }}</p>
        <p v-if="errorMsg" class="text-red-400 mt-2 text-center">{{ errorMsg }}</p>
      </div>

      <div class="md:col-span-2 bg-secondary-bg p-6 rounded-lg shadow-lg h-96 flex flex-col">
        <h2 class="text-2xl font-semibold mb-2 flex-shrink-0">Vista Previa</h2>
        <div class="relative flex-grow overflow-y-auto">
          <div v-if="chartData.datasets && chartData.datasets[0]?.data.length > 0 || chartType === 'table'"
            class="w-full h-full">
            <BarChart v-if="chartType === 'bar'" :chart-data="chartData" :chart-options="chartOptions" />
            <LineChart v-else-if="chartType === 'line'" :chart-data="chartData" :chart-options="chartOptions" />
            <DataTable v-else-if="chartType === 'table'" :data="tableData" />
          </div>
          <div v-else class="flex items-center justify-center h-full text-secondary-text">
            <p>Por favor, configura el gráfico para ver una vista previa.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>