import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { createVisualization, deleteVisualization, deleteMultipleVisualizations } from '../controllers/visualization.controller.js';

const router = Router();

// Por ahora solo necesitamos la ruta para crear.
router.post('/create', protect, createVisualization);
router.delete('/:id', protect, deleteVisualization);
router.delete('/', protect, deleteMultipleVisualizations);

export default router;