import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

// --- IMPORTAR RUTAS ---
import authRoutes from './routes/auth.routes.js';
import datasetRoutes from './routes/dataset.routes.js';
import visualizationRoutes from './routes/visualization.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import importRoutes from './routes/import.routes.js';


// Inicializar la aplicación Express
const app = express();

// --- Middlewares Esenciales ---
app.use(cors({
  origin: 'https://visuadata-backend.onrender.com', // <-- Pega tu URL de Vercel aquí
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// --- RUTAS ---
// Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡La API de VisuaData está viva!');
});

// Usa las rutas de autenticación con el prefijo /api/auth
app.use('/api/auth', authRoutes);
// Usa las rutas de datasets
app.use('/api/datasets', datasetRoutes);
app.use('/api/visualizations', visualizationRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/import', importRoutes);

// --- Iniciar el Servidor ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log(`Accede en http://localhost:${PORT}`);
});