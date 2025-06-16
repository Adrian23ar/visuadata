import jwt from 'jsonwebtoken';
import db from '../db/index.js';

export const protect = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'No autorizado, no hay token.' });
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Obtener el usuario de la BD (sin la contraseña) y adjuntarlo a la petición
    const userQuery = await db.query('SELECT id, name, email FROM users WHERE id = $1', [decoded.id]);
    req.user = userQuery.rows[0];

    next(); // Continuar a la siguiente función/controlador
  } catch (error) {
    res.status(401).json({ message: 'No autorizado, token inválido.' });
  }
};