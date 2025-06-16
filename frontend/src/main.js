import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './main.css'
import { useAuthStore } from './store/auth'; // <-- IMPORTA EL STORE

async function startApp() {
    const app = createApp(App)
    app.use(createPinia())

    // Antes de cargar el router o la app, intenta verificar la sesión
    const authStore = useAuthStore();
    try {
        await authStore.checkAuthStatus();
    } catch(e) {
        console.log("No hay sesión activa, continuando...");
    }

    app.use(router)
    app.mount('#app')
}

startApp();