<script setup>
// frontend/src/views/DashboardView.vue
import { ref, onMounted, computed } from 'vue';
import api from '../services/api';
import { GridLayout, GridItem } from 'vue3-grid-layout-next';
import BarChart from '../components/charts/BarChart.vue';
import LineChart from '../components/charts/LineChart.vue';
import DataTable from '../components/charts/Datatable.vue';
import ConfirmationModal from '../components/ConfirmationModal.vue';
import { TrashIcon } from '@heroicons/vue/24/outline';

// --- Estado del Componente ---
const layout = ref([]);
const visualizations = ref([]);
const isLoading = ref(true);
const modalState = ref({ show: false, title: '', message: '', onConfirm: () => { } });
const selectedVizIds = ref(new Set()); // Estado para los IDs de los widgets seleccionados

onMounted(async () => {
    try {
        const response = await api.get('/dashboards/main');
        const dashboardData = response.data;
        visualizations.value = dashboardData.visualizations.map(viz => {
            const data = typeof viz.data_json === 'string' ? JSON.parse(viz.data_json) : viz.data_json;
            const config = typeof viz.config === 'string' ? JSON.parse(viz.config) : viz.config;
            return { ...viz, data_json: data, config: config };
        });
        const savedLayout = Array.isArray(dashboardData.layout) ? dashboardData.layout : JSON.parse(dashboardData.layout || '[]');
        if (savedLayout && savedLayout.length > 0 && visualizations.value.every(viz => savedLayout.some(item => item.i === viz.id.toString()))) {
            layout.value = savedLayout;
        } else {
            layout.value = visualizations.value.map((viz, index) => ({
                x: (index * 6) % 12, y: Math.floor(index / 2) * 6,
                w: 6, h: 6, i: viz.id.toString(),
            }));
        }
    } catch (error) {
        console.error("No se pudo cargar el dashboard", error);
    } finally {
        isLoading.value = false;
    }
});

const dashboardItems = computed(() => {
    return layout.value.map(item => {
        const visualization = visualizations.value.find(v => v.id.toString() === item.i);
        return { ...item, vizData: visualization };
    }).filter(item => item.vizData);
});

const selectAll = computed({
    get: () => visualizations.value.length > 0 && selectedVizIds.value.size === visualizations.value.length,
    set: (value) => {
        selectedVizIds.value.clear();
        if (value) {
            visualizations.value.forEach(v => selectedVizIds.value.add(v.id));
        }
    }
});

// --- LÓGICA DE GRÁFICOS FINAL Y CORRECTA ---
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

const getChartDataForViz = (viz) => {
    if (!viz || !viz.config || !viz.data_json) return { labels: [], datasets: [] };
    const { labelColumn, dataColumn } = viz.config;
    const isTimeSeries = ['fecha_valor', 'fecha_operacion'].includes(labelColumn);

    // Para gráficos de tiempo, siempre queremos un orden cronológico ascendente (de izq. a der.)
    let processedData = [...viz.data_json];
    if (isTimeSeries) {
        processedData.sort((a, b) => new Date(parseDateForChart(a[labelColumn])) - new Date(parseDateForChart(b[labelColumn])));
    }

    // Lógica específica para Gráfico de Líneas con Eje de Tiempo
    if (viz.chart_type === 'line' && isTimeSeries) {
        return {
            datasets: [{
                label: dataColumn, backgroundColor: '#00C896', borderColor: '#00C896',
                data: processedData.map(item => ({ x: parseDateForChart(item[labelColumn]), y: parseFloat(item[dataColumn]) || 0 })),
            }]
        };
    }

    // Lógica para todos los demás casos (Barras y categorías de texto)
    return {
        labels: processedData.map(item => isTimeSeries ? formatDateForLabel(item[labelColumn]) : item[labelColumn]),
        datasets: [{
            label: dataColumn, backgroundColor: '#00C896',
            data: processedData.map(item => parseFloat(item[dataColumn]) || 0),
        }]
    };
};

const getChartOptionsForViz = (viz) => {
    if (!viz || !viz.config) return {};
    const { labelColumn } = viz.config;
    const isTimeSeries = ['fecha_valor', 'fecha_operacion'].includes(labelColumn);

    // Opciones específicas para Gráfico de Líneas con Eje de Tiempo
    if (viz.chart_type === 'line' && isTimeSeries) {
        return {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { type: 'time', time: { unit: 'day', tooltipFormat: 'dd/MM/yyyy', displayFormats: { day: 'MMM d' } }, distribution: 'series' } }
        };
    }

    // Opciones específicas para Gráfico de Barras con Eje de Tiempo (para el tooltip)
    if (viz.chart_type === 'bar' && isTimeSeries) {
        const sortedData = [...viz.data_json].sort((a, b) => new Date(parseDateForChart(a[labelColumn])) - new Date(parseDateForChart(b[labelColumn])));
        return {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function (tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            const originalDataItem = sortedData[index];
                            return originalDataItem ? originalDataItem[labelColumn] : '';
                        }
                    }
                }
            }
        };
    }

    // Opciones por defecto para todos los demás casos
    return { responsive: true, maintainAspectRatio: false };
};
// --- Acciones del Componente ---
const layoutUpdated = async (newLayout) => {
    try {
        await api.put('/dashboards/layout', { layout: newLayout });
    } catch (e) { console.error("Error guardando el layout:", e); }
};

const closeModal = () => modalState.value.show = false;

const handleDeleteVisualization = (viz) => {
    modalState.value = {
        show: true,
        title: 'Eliminar Visualización',
        message: `¿Estás seguro de que quieres eliminar "${viz.name}"? Esta acción no se puede deshacer.`,
        onConfirm: async () => {
            try {
                await api.delete(`/visualizations/${viz.id}`);
                visualizations.value = visualizations.value.filter(v => v.id !== viz.id);
                layout.value = layout.value.filter(l => l.i !== viz.id.toString());
                closeModal();
            } catch (error) {
                console.error("Error al eliminar la visualización", error);
                closeModal();
            }
        }
    };
};

const handleDeleteMultiple = () => {
    const count = selectedVizIds.value.size;
    if (count === 0) return;

    modalState.value = {
        show: true,
        title: 'Eliminar Visualizaciones',
        message: `¿Estás seguro de que quieres eliminar ${count} visualizaciones? Esta acción no se puede deshacer.`,
        onConfirm: async () => {
            try {
                const idsToDelete = Array.from(selectedVizIds.value);
                await api.delete('/visualizations', { data: { ids: idsToDelete } });

                // Actualización instantánea de la UI
                visualizations.value = visualizations.value.filter(v => !selectedVizIds.value.has(v.id));
                layout.value = layout.value.filter(l => !selectedVizIds.value.has(parseInt(l.i)));
                selectedVizIds.value.clear();
                closeModal();
            } catch (error) {
                console.error("Error en la eliminación múltiple", error);
                closeModal();
            }
        }
    };
};
</script>

<template>
    <div class="p-4 md:p-8 w-full">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-4xl font-bold text-primary-text">Dashboard</h1>
            <button v-if="selectedVizIds.size > 0" @click="handleDeleteMultiple"
                class="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2 transition-all">
                <TrashIcon class="h-5 w-5" />
                Eliminar Seleccionados ({{ selectedVizIds.size }})
            </button>
        </div>

        <div v-if="isLoading">Cargando...</div>

        <div v-else-if="visualizations.length > 0">
            <div class="flex items-center p-4 mb-4 bg-secondary-bg rounded-lg">
                <input type="checkbox" v-model="selectAll"
                    class="h-5 w-5 rounded bg-primary-bg border-secondary-accent text-primary-accent focus:ring-primary-accent" />
                <span class="ml-4 font-semibold text-secondary-text">Seleccionar Todo</span>
            </div>

            <grid-layout v-model:layout="layout" :col-num="12" :row-height="30" :is-draggable="true"
                :is-resizable="true" :responsive="true" :breakpoints="{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }"
                :cols="{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }" @layout-updated="layoutUpdated">
                <grid-item v-for="item in dashboardItems" :key="item.i" :x="item.x" :y="item.y" :w="item.w" :h="item.h"
                    :i="item.i" class="bg-secondary-bg rounded-lg shadow-lg p-4 flex flex-col group transition-all"
                    :class="{ 'ring-2 ring-primary-accent': selectedVizIds.has(item.vizData.id) }">
                    <div v-if="item.vizData" class="h-full w-full flex flex-col">
                        <div class="flex justify-between items-center mb-2 flex-shrink-0">
                            <div class="flex items-center gap-3 flex-grow truncate">
                                <input type="checkbox" :value="item.vizData.id"
                                    @change="() => { selectedVizIds.has(item.vizData.id) ? selectedVizIds.delete(item.vizData.id) : selectedVizIds.add(item.vizData.id) }"
                                    :checked="selectedVizIds.has(item.vizData.id)"
                                    class="h-5 w-5 rounded bg-primary-bg border-secondary-accent text-primary-accent focus:ring-primary-accent flex-shrink-0" />
                                <h3 class="text-lg font-bold text-primary-text truncate">{{ item.vizData.name }}</h3>
                            </div>
                            <button @click="handleDeleteVisualization(item.vizData)"
                                class="text-secondary-text hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <TrashIcon class="h-5 w-5" />
                            </button>
                        </div>

                        <div class="relative flex-grow min-h-0 overflow-auto">
                            <BarChart v-if="item.vizData.chart_type === 'bar'"
                                :chart-data="getChartDataForViz(item.vizData)"
                                :chart-options="getChartOptionsForViz(item.vizData)" />
                            <LineChart v-else-if="item.vizData.chart_type === 'line'"
                                :chart-data="getChartDataForViz(item.vizData)"
                                :chart-options="getChartOptionsForViz(item.vizData)" />
                            <DataTable v-else-if="item.vizData.chart_type === 'table'" :data="item.vizData.data_json" />
                        </div>
                    </div>
                </grid-item>
            </grid-layout>
        </div>

        <div v-else class="text-center p-16 bg-secondary-bg rounded-lg mt-10">
            <svg class="mx-auto h-16 w-16 text-primary-accent" viewBox="0 0 24 24" fill="currentColor"
                xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="7.5" height="8" rx="1.5" ry="1.5" />
                <rect x="14" y="4" width="7.5" height="5.5" rx="1.5" ry="1.5" />
                <rect x="4" y="14.5" width="7.5" height="5.5" rx="1.5" ry="1.5" />
                <rect x="14" y="12" width="7.5" height="8" rx="1.5" ry="1.5" />
            </svg>
            <h2 class="mt-6 text-2xl font-bold text-primary-text">Tu Dashboard está Vacío</h2>
            <p class="text-secondary-text mt-2 mb-6">Parece que aún no has guardado ninguna visualización.</p>
            <RouterLink to="/datasets"
                class="inline-block px-6 py-3 font-bold text-white bg-primary-accent rounded-lg hover:opacity-90 transition-opacity">
                Crear mi primera visualización
            </RouterLink>
        </div>
    </div>

    <ConfirmationModal :show="modalState.show" :title="modalState.title" :message="modalState.message"
        @confirm="modalState.onConfirm" @cancel="closeModal" />
</template>
