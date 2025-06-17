// backend/db/init.js
import db from './index.js';

const createTables = async () => {
  // SQL para crear las tablas. Lo separamos en un bloque de texto largo.
  const createTablesQuery = `
    -- Habilitar la extensión para generar UUIDs, si no existe
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS datasets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_name VARCHAR(255) NOT NULL,
      data_json JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS visualizations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      chart_type VARCHAR(50) NOT NULL,
      config JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dashboards (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      layout JSONB,
      share_id UUID DEFAULT gen_random_uuid() UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS dashboard_visualizations (
      dashboard_id INTEGER NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
      visualization_id INTEGER NOT NULL REFERENCES visualizations(id) ON DELETE CASCADE,
      PRIMARY KEY (dashboard_id, visualization_id)
    );
  `;

  try {
    // Usamos el pool de conexión para ejecutar el query.
    console.log('Creando tablas en la base de datos...');
    await db.query(createTablesQuery);
    console.log('¡Tablas creadas exitosamente!');
  } catch (err) {
    console.error('Error creando las tablas:', err);
  }
};

// Ejecutamos la función.
createTables();