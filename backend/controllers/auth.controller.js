import db from '../db/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validar que los datos no estén vacíos
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    // 2. Verificar si el usuario ya existe
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
    }

    // 3. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Insertar el nuevo usuario en la base de datos
    const newUser = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );

    // 5. Crear el Token JWT
    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: '1d', // El token expira en 1 día
    });

    // 6. Enviar el token en una cookie HttpOnly (más seguro)
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Siempre 'true' en producción (Render/Vercel usan HTTPS)
      sameSite: 'none', // <-- LA SOLUCIÓN: Permite que la cookie se envíe entre dominios
      maxAge: 24 * 60 * 60 * 1000,
    });

    // 7. Enviar la respuesta
    res.status(201).json(newUser.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validar que los datos no estén vacíos
    if (!email || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    // 2. Buscar al usuario por email
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Credenciales inválidas.' }); // Mensaje genérico
    }

    const user = userCheck.rows[0];

    // 3. Comparar la contraseña enviada con la hasheada en la BD
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(404).json({ message: 'Credenciales inválidas.' });
    }

    // 4. Crear y enviar el token (igual que en el registro)
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Siempre 'true' en producción (Render/Vercel usan HTTPS)
      sameSite: 'none', // <-- LA SOLUCIÓN: Permite que la cookie se envíe entre dominios
      maxAge: 24 * 60 * 60 * 1000,
    });

    // 5. Enviar la respuesta sin el hash de la contraseña
    delete user.password_hash;
    res.status(200).json(user);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
};