import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.middleware.js';
import { uploadDataset, getDatasets, getDatasetById, deleteDataset, deleteMultipleDatasets } from '../controllers/dataset.controller.js';

const router = Router();

// Configuración de Multer para guardar el archivo en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Definimos las rutas, todas protegidas
router.get('/', protect, getDatasets);
router.get('/:id', protect, getDatasetById);
// NUEVAS RUTAS
router.delete('/', protect, deleteMultipleDatasets); // Para borrado múltiple
router.delete('/:id', protect, deleteDataset);     // Para borrado individual


router.post('/upload', protect, upload.single('datasetFile'), uploadDataset);

export default router;