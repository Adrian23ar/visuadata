import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getMainDashboard, updateLayout } from '../controllers/dashboard.controller.js';

const router = Router();

// Una ruta especial para obtener el dashboard principal del usuario logueado
router.get('/main', protect, getMainDashboard);
router.put('/layout', protect, updateLayout);

export default router;