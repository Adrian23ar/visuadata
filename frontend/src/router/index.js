import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth.js';
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import DatasetManagerView from '../views/DatasetManagerView.vue';
import CreateVisualizationView from '../views/CreateVisualizationView.vue';

import MainLayout from '../layouts/MainLayout.vue';

const routes = [
    // Rutas públicas que NO usan el layout con sidebar
    { path: '/login', name: 'Login', component: LoginView },
    { path: '/register', name: 'Register', component: RegisterView },

    // Ruta padre que usa el MainLayout
    {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
            { path: '', redirect: '/dashboard' }, // Redirige la raíz a /dashboard
            { path: 'dashboard', name: 'Dashboard', component: DashboardView },
            { path: 'datasets', name: 'Datasets', component: DatasetManagerView },
            { path: 'visualizations/create/:datasetId', name: 'CreateVisualization', component: CreateVisualizationView },
        ]
    },
]

const router = createRouter({ history: createWebHistory(), routes });

// Guardia de Navegación (Navigation Guard) - VERSIÓN CORREGIDA
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const isAuthenticated = authStore.isAuthenticated; // <-- NUESTRA NUEVA FUENTE DE VERDAD

    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'Login' });
    } else if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
        next({ name: 'Dashboard' });
    } else {
        next();
    }
});

export default router