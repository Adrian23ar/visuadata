<script setup>
// frontend/src/views/DatasetManagerView.vue
import { ref, onMounted, computed } from 'vue';
import { RouterLink } from 'vue-router';
import api from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal.vue';
import { TrashIcon, ChartPieIcon } from '@heroicons/vue/24/outline';

// --- State Refs ---
const datasets = ref([]);
const selectedFile = ref(null);
const errorMsg = ref(null);
const successMsg = ref(null);
const isImporting = ref(false);
const selectedIds = ref(new Set()); // Usamos un Set para manejar fácilmente las selecciones únicas
const modalState = ref({
    show: false,
    title: '',
    message: '',
    onConfirm: () => { },
});

// --- Computed Properties ---
const selectAll = computed({
    get: () => datasets.value.length > 0 && selectedIds.value.size === datasets.value.length,
    set: (value) => {
        selectedIds.value.clear();
        if (value) {
            datasets.value.forEach(d => selectedIds.value.add(d.id));
        }
    }
});

const fetchDatasets = async () => {
    try {
        const response = await api.get('/datasets');
        const data = response.data;

        // --- LÓGICA DE ORDENAMIENTO ---
        data.sort((a, b) => {
            // Extraemos la fecha del nombre del archivo, ej: "BCV_Tasas_DDMMYYYY.xls"
            const dateA_str = a.file_name.match(/(\d{8})/);
            const dateB_str = b.file_name.match(/(\d{8})/);

            // Si el formato de nombre no coincide, no los movemos.
            if (!dateA_str || !dateB_str) return 0;

            // Reconstruimos la fecha a un formato que JavaScript entienda (YYYY-MM-DD)
            const dateA = new Date(`${dateA_str[1].substring(4)}-${dateA_str[1].substring(2, 4)}-${dateA_str[1].substring(0, 2)}`);
            const dateB = new Date(`${dateB_str[1].substring(4)}-${dateB_str[1].substring(2, 4)}-${dateB_str[1].substring(0, 2)}`);

            // Ordenamos de más reciente a más antiguo (descendente)
            return dateB - dateA;
        });

        datasets.value = data;
    } catch (error) {
        errorMsg.value = 'No se pudo cargar la lista de datasets.';
    }
};

const handleFileChange = (event) => {
    selectedFile.value = event.target.files[0];
};
const handleUpload = async () => {
    if (!selectedFile.value) {
        errorMsg.value = 'Por favor, selecciona un archivo.';
        return;
    }
    errorMsg.value = null;
    successMsg.value = null;

    const formData = new FormData();
    formData.append('datasetFile', selectedFile.value);

    try {
        await api.post('/datasets/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        successMsg.value = '¡Archivo subido exitosamente!';
        selectedFile.value = null; // Limpiar input
        document.getElementById('file-input').value = ''; // Limpiar input
        await fetchDatasets(); // Recargar la lista
    } catch (error) {
        errorMsg.value = 'Error al subir el archivo.';
    }
};
const handleBCVImport = async () => {
    isImporting.value = true;
    errorMsg.value = null;
    successMsg.value = null;
    try {
        await api.post('/import/bcv');
        successMsg.value = '¡Datos del BCV importados y guardados como un nuevo dataset!';
        await fetchDatasets(); // Refrescar la lista para mostrar el nuevo archivo
    } catch (error) {
        errorMsg.value = error.response?.data?.message || 'Falló la importación.';
    } finally {
        isImporting.value = false;
    }
};

const handleBCVTimeSeriesImport = async () => {
    isImporting.value = true;
    errorMsg.value = null;
    successMsg.value = null;
    try {
        await api.post('/import/bcv-timeseries');
        successMsg.value = '¡Histórico de la tasa del dólar importado con éxito!';
        await fetchDatasets(); // Refrescar la lista
    } catch (error) {
        errorMsg.value = error.response?.data?.message || 'Falló la importación del histórico.';
    } finally {
        isImporting.value = false;
    }
};

// --- Deletion Logic ---
const openModal = (title, message, onConfirm) => {
    modalState.value = { show: true, title, message, onConfirm };
};

const closeModal = () => {
    modalState.value.show = false;
};

const handleDeleteSingle = (dataset) => {
    openModal(
        'Eliminar Dataset',
        `¿Estás seguro de que quieres eliminar "${dataset.file_name}"? Esta acción no se puede deshacer.`,
        async () => {
            await api.delete(`/datasets/${dataset.id}`);
            fetchDatasets();
            closeModal();
        }
    );
};

const handleDeleteMultiple = () => {
    const count = selectedIds.value.size;
    if (count === 0) return;

    openModal(
        'Eliminar Datasets',
        `¿Estás seguro de que quieres eliminar ${count} datasets? Esta acción no se puede deshacer.`,
        async () => {
            await api.delete('/datasets', { data: { ids: Array.from(selectedIds.value) } });
            fetchDatasets();
            selectedIds.value.clear();
            closeModal();
        }
    );
};

onMounted(fetchDatasets);
</script>

<template>
    <div class="w-full mx-auto p-8">
        <div class="flex items-center justify-between mb-8">
            <h1 class="text-4xl font-bold text-primary-text">Gestor de Datasets</h1>
            <RouterLink to="/dashboard"
                class="flex items-center gap-2 px-4 py-2 font-bold text-white bg-primary-accent rounded-lg hover:opacity-90 transition-opacity">
                <ChartPieIcon class="h-5 w-5" />
                Ir al Dashboard
            </RouterLink>
        </div>
        <div class="bg-secondary-bg p-6 rounded-lg shadow-lg mb-8">
            <h2 class="text-2xl font-semibold mb-4 text-primary-text">Añadir Nuevo Dataset</h2>

            <div class="flex items-center space-x-4">
                <input id="file-input" type="file" @change="handleFileChange" accept=".csv,.xls,.xlsx"
                    class="block w-full text-sm text-secondary-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-accent file:text-white hover:file:opacity-90" />
                <button @click="handleUpload"
                    class="px-6 py-2 font-bold text-white bg-primary-accent rounded-full hover:opacity-90 transition-opacity whitespace-nowrap">Subir
                    Archivo</button>
            </div>

            <p v-if="successMsg && !isImporting" class="text-green-400 mt-4">{{ successMsg }}</p>
            <p v-if="errorMsg && !isImporting" class="text-red-400 mt-4">{{ errorMsg }}</p>

            <div class="border-t border-secondary-accent my-6"></div>
            <div class="flex items-center space-x-4">
                <p class="text-secondary-text flex-grow">O importa los datos más recientes directamente del BCV:</p>
                <button @click="handleBCVImport" :disabled="isImporting"
                    class="px-6 py-2 font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors whitespace-nowrap disabled:bg-gray-500 disabled:cursor-not-allowed">
                    {{ isImporting ? 'Importando...' : 'Importar del BCV' }}
                </button>
                <button @click="handleBCVTimeSeriesImport" :disabled="isImporting"
                    class="px-6 py-2 font-bold text-white bg-teal-600 rounded-full hover:bg-teal-700 transition-colors whitespace-nowrap disabled:bg-gray-500 disabled:cursor-not-allowed">
                    Importar Histórico USD
                </button>
            </div>

            <p v-if="successMsg && isImporting" class="text-green-400 mt-4">{{ successMsg }}</p>
            <p v-if="errorMsg && isImporting" class="text-red-400 mt-4">{{ errorMsg }}</p>
        </div>

        <div class="bg-secondary-bg p-6 rounded-lg shadow-lg">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-semibold text-primary-text">Mis Datasets</h2>
                <button v-if="selectedIds.size > 0" @click="handleDeleteMultiple"
                    class="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2">
                    <TrashIcon class="h-5 w-5" />
                    Eliminar Seleccionados ({{ selectedIds.size }})
                </button>
            </div>

            <div v-if="datasets.length > 0">
                <div class="flex items-center p-4 border-b border-secondary-accent">
                    <input type="checkbox" v-model="selectAll"
                        class="h-5 w-5 rounded bg-primary-bg border-secondary-accent text-primary-accent focus:ring-primary-accent" />
                    <span class="ml-4 font-semibold text-secondary-text">Seleccionar Todo</span>
                </div>
                <ul class="space-y-2 mt-2">
                    <li v-for="dataset in datasets" :key="dataset.id"
                        class="flex items-center bg-primary-bg p-4 rounded-md hover:bg-gray-800/50">
                        <input type="checkbox" :value="dataset.id"
                            @change="() => { selectedIds.has(dataset.id) ? selectedIds.delete(dataset.id) : selectedIds.add(dataset.id) }"
                            :checked="selectedIds.has(dataset.id)"
                            class="h-5 w-5 rounded bg-primary-bg border-secondary-accent text-primary-accent focus:ring-primary-accent" />
                        <span class="ml-4 font-medium text-primary-text flex-grow">{{ dataset.file_name }}</span>
                        <span class="text-sm text-secondary-text mr-4">{{ new
                            Date(dataset.created_at).toLocaleDateString() }}</span>
                        <RouterLink :to="`/visualizations/create/${dataset.id}`"
                            class="px-4 py-1 text-sm font-bold text-white bg-primary-accent rounded-full hover:opacity-90 transition-opacity mr-4">
                            Crear Gráfico
                        </RouterLink>
                        <button @click="handleDeleteSingle(dataset)" class="text-secondary-text hover:text-red-500">
                            <TrashIcon class="h-6 w-6" />
                        </button>
                    </li>
                </ul>
            </div>
            <p v-else class="text-secondary-text text-center py-8">Aún no has subido ningún dataset.</p>
        </div>
    </div>

    <ConfirmationModal :show="modalState.show" :title="modalState.title" :message="modalState.message"
        @confirm="modalState.onConfirm" @cancel="closeModal" />
</template>