// backend/routes/import.routes.js
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { runBCVImport, runBCVTimeSeriesImport } from '../controllers/import.controller.js';

const router = Router();

// Ruta que activará la importación, protegida para que solo usuarios logueados puedan usarla
router.post('/bcv', protect, runBCVImport);
router.post('/bcv-timeseries', protect, runBCVTimeSeriesImport);

export default router;