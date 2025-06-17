// backend/db/index.js
import pg from 'pg';
import 'dotenv/config';

// La clase Pool de pg maneja las conexiones por nosotros.
const { Pool } = pg;

// Creamos un nuevo pool de conexiones usando las variables de entorno.
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { // <-- AÑADIR ESTE OBJETO
    rejectUnauthorized: false
  }
});

// Exportamos una función 'query' que podremos usar en toda la aplicación
// para interactuar con la base de datos.
export default {
  query: (text, params) => pool.query(text, params),
};