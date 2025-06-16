<script setup>
import { computed } from 'vue';

const props = defineProps({
    data: {
        type: Array,
        required: true,
    },
});

// Extraemos las cabeceras (headers) dinámicamente a partir de las claves del primer objeto de datos.
const headers = computed(() => {
    if (props.data.length === 0) return [];
    // Convertimos nombres como 'fecha_valor' a 'Fecha Valor' para que se vean mejor.
    return Object.keys(props.data[0]).map(key =>
        key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
});

// Obtenemos las claves para poder acceder a los datos en el template.
const keys = computed(() => {
    if (props.data.length === 0) return [];
    return Object.keys(props.data[0]);
});
</script>

<template>
    <div class="h-full mt-2">
        <table v-if="data.length > 0" class="min-w-full text-sm text-left text-secondary-text">
            <thead class="text-xs text-primary-text uppercase bg-primary-bg sticky top-0">
                <tr>
                    <th v-for="header in headers" :key="header" scope="col" class="px-6 py-3">
                        {{ header }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(row, rowIndex) in data" :key="rowIndex"
                    class="border-b border-secondary-accent hover:bg-gray-800/50">
                    <td v-for="key in keys" :key="key" class="px-6 py-4">
                        {{ row[key] }}
                    </td>
                </tr>
            </tbody>
        </table>
        <p v-else>No hay datos para mostrar.</p>
    </div>
</template>

<style scoped>
/* Para asegurar que el scroll funcione dentro del contenedor del gráfico */
.h-full {
    height: 100%;
}


</style>