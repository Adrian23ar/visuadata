// backend/controllers/dataset.controller.js
import db from '../db/index.js';
import Papa from 'papaparse';
import xlsx from 'node-xlsx'; // Asegúrate de que node-xlsx esté importado aquí

export const uploadDataset = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
        }

        const fileName = req.file.originalname;
        const userId = req.user.id;
        let transformedData = [];

        // 1. Obtenemos la extensión del archivo para decidir cómo procesarlo.
        const extension = fileName.split('.').pop().toLowerCase();

        // 2. Lógica condicional basada en la extensión
        if (extension === 'csv') {
            // --- LÓGICA PARA ARCHIVOS CSV GENÉRICOS ---
            const fileContent = req.file.buffer.toString('utf8');
            const parsedResult = Papa.parse(fileContent, {
                header: true,       // Asumimos que la primera fila es la cabecera
                skipEmptyLines: true,
                dynamicTyping: true, // Intenta convertir números y booleanos automáticamente
            });
            transformedData = parsedResult.data;

        } else if (extension === 'xls' || extension === 'xlsx') {
            // --- LÓGICA PARA ARCHIVOS EXCEL ---
            const worksheets = xlsx.parse(req.file.buffer);
            // Tomamos la primera hoja del libro de trabajo
            const sheetData = worksheets[0]?.data;

            if (sheetData && sheetData.length > 1) {
                // La primera fila son las cabeceras (headers)
                const headers = sheetData[0];
                // El resto de las filas son los datos
                const rows = sheetData.slice(1);

                transformedData = rows.map(row => {
                    let obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index];
                    });
                    return obj;
                });
            }

        } else {
            return res.status(400).json({ message: 'Formato de archivo no soportado. Por favor, sube un CSV o Excel.' });
        }

        // Si después de procesar no hay datos, devolvemos un error.
        if (transformedData.length === 0) {
            return res.status(400).json({ message: 'El archivo parece estar vacío o no se pudo procesar.' });
        }

        // 3. El resto del proceso es el mismo: guardar en la base de datos.
        const jsonData = JSON.stringify(transformedData);

        const newDataset = await db.query(
            'INSERT INTO datasets (user_id, file_name, data_json) VALUES ($1, $2, $3) RETURNING id, file_name, created_at',
            [userId, fileName, jsonData]
        );

        res.status(201).json(newDataset.rows[0]);

    } catch (error) {
        console.error("Error al subir el dataset:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Obtener todos los datasets de un usuario
export const getDatasets = async (req, res) => {
    try {
        const userId = req.user.id;
        // Obtenemos todos los datasets pero sin la data_json para que la respuesta sea ligera
        const datasets = await db.query(
            'SELECT id, file_name, created_at FROM datasets WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.status(200).json(datasets.rows);
    } catch (error) {
        console.error("Error al obtener los datasets:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const getDatasetById = async (req, res) => {
    try {
        const userId = req.user.id;
        const datasetId = req.params.id;

        const dataset = await db.query(
            // Verificamos que el dataset pertenece al usuario que lo solicita
            'SELECT * FROM datasets WHERE id = $1 AND user_id = $2',
            [datasetId, userId]
        );

        if (dataset.rows.length === 0) {
            return res.status(404).json({ message: 'Dataset no encontrado o no tienes permiso para verlo.' });
        }

        res.status(200).json(dataset.rows[0]);
    } catch (error) {
        console.error("Error al obtener el dataset:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Eliminar un solo dataset
export const deleteDataset = async (req, res) => {
    try {
        const userId = req.user.id;
        const datasetId = req.params.id;

        const deleteResult = await db.query(
            // Nos aseguramos que el usuario solo pueda borrar sus propios datasets
            'DELETE FROM datasets WHERE id = $1 AND user_id = $2',
            [datasetId, userId]
        );

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ message: 'Dataset no encontrado o no tienes permiso para eliminarlo.' });
        }

        res.status(200).json({ message: 'Dataset eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Eliminar múltiples datasets a la vez
export const deleteMultipleDatasets = async (req, res) => {
    try {
        const userId = req.user.id;
        const { ids } = req.body; // Esperamos un array de IDs: { ids: [1, 2, 3] }

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Se requiere un array de IDs.' });
        }

        // Usamos ANY($1::int[]) para buscar en el array de IDs de forma segura
        await db.query(
            'DELETE FROM datasets WHERE id = ANY($1::int[]) AND user_id = $2',
            [ids, userId]
        );

        res.status(200).json({ message: `${ids.length} datasets eliminados exitosamente.` });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};