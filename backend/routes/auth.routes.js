import { Router } from 'express';
import { register, login, logout } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Ruta protegida
// Si el usuario tiene un token válido, le devolverá sus datos.
router.get('/me', protect, (req, res) => {
    res.status(200).json(req.user);
});

export default router;