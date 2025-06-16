// backend/importers/bcvImporter.js
import axios from 'axios';
import xlsx from 'node-xlsx';
import db from '../db/index.js';
import https from 'https';

/**
 * Toma los datos parseados de la hoja de Excel del BCV y los limpia.
 * @param {object} worksheet - El objeto de la hoja de cálculo parseado por node-xlsx.
 * @returns {Array<object>} Un array de objetos con los datos limpios y listos para guardar.
 */
function cleanAndTransformBCVData(worksheet) {
    // En los archivos .xls, los datos están en un array de arrays.
    const lines = worksheet.data;

    // Encontrar la fila donde empiezan los datos de las monedas (usualmente con 'EUR').
    let startIndex = lines.findIndex(row => row && row[0] === 'EUR');
    if (startIndex === -1) {
        throw new Error('No se pudo encontrar el formato de datos esperado (EUR) en el archivo Excel.');
    }

    // Encontrar el final de la tabla de datos (la primera fila vacía después del inicio).
    let endIndex = lines.findIndex((line, index) => index > startIndex && (!line || line.every(cell => cell === null || cell === '')));

    // Extraer solo las líneas de datos. Si no se encontró un final, tomar todo hasta el final del archivo.
    const dataRows = endIndex === -1 ? lines.slice(startIndex) : lines.slice(startIndex, endIndex);

    // Definir encabezados limpios para nuestro formato JSON.
    const cleanHeaders = ['Moneda', 'Pais', 'Compra_USD', 'Venta_USD', 'Compra_BS', 'Venta_BS'];

    // Mapear cada fila a un objeto con los encabezados correctos y limpiar los datos.
    const transformedData = dataRows.map(row => {
        let obj = {};
        cleanHeaders.forEach((header, index) => {
            let value = row[index] || '';

            // Si la columna es numérica (índice > 1), la procesamos como número.
            if (index > 1) {
                // La librería xlsx usualmente convierte los números correctamente,
                // pero nos aseguramos de que sea un float.
                obj[header] = parseFloat(value) || 0;
            } else {
                // Si es texto, solo quitamos espacios en blanco.
                obj[header] = typeof value === 'string' ? value.trim() : value;
            }
        });
        return obj;
    }).filter(row => row && row.Moneda); // Filtrar cualquier fila vacía que pueda haberse colado.

    return transformedData;
}


/**
 * Función final que descarga, VERIFICA DUPLICADOS, itera, y guarda solo las hojas nuevas.
 * @param {number} userId - El ID del usuario que realiza la importación.
 * @returns {Promise<Array<object>>} Una promesa que se resuelve con un array de los nuevos datasets creados.
 */
export const importBCVData = async (userId) => {
    const url = 'https://www.bcv.org.ve/sites/default/files/EstadisticasGeneral/2_1_2b25_smc.xls';

    try {
        // --- INICIO DE LA LÓGICA ANTI-DUPLICADOS ---

        // 1. Obtener todos los nombres de archivo existentes para este usuario.
        const existingDatasetsQuery = await db.query('SELECT file_name FROM datasets WHERE user_id = $1', [userId]);

        // 2. Guardarlos en un Set para una búsqueda ultra-rápida y eficiente.
        const existingFilenames = new Set(existingDatasetsQuery.rows.map(row => row.file_name));

        // --- FIN DE LA LÓGICA ANTI-DUPLICADOS ---


        const agent = new https.Agent({ rejectUnauthorized: false });
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            httpsAgent: agent
        });

        const buffer = response.data;
        const worksheets = xlsx.parse(buffer);

        if (!worksheets || worksheets.length === 0) {
            throw new Error('El archivo Excel está vacío o corrupto.');
        }

        const createdDatasets = [];

        for (const worksheet of worksheets) {
            // Construir el nombre de archivo que esta hoja tendría.
            const fileName = `BCV_Tasas_${worksheet.name}.xls`;

            // Comprobar si este nombre de archivo ya existe en nuestro Set.
            if (existingFilenames.has(fileName)) {
                console.log(`Ignorando hoja '${worksheet.name}', el dataset '${fileName}' ya existe.`);
                continue; // Si ya existe, saltamos a la siguiente iteración del bucle.
            }

            console.log(`Procesando hoja nueva: ${worksheet.name}...`);
            try {
                const cleanData = cleanAndTransformBCVData(worksheet);

                if (cleanData.length === 0) {
                    console.log(`Hoja '${worksheet.name}' saltada por no contener datos válidos.`);
                    continue;
                }

                const jsonData = JSON.stringify(cleanData);

                const newDataset = await db.query(
                    'INSERT INTO datasets (user_id, file_name, data_json) VALUES ($1, $2, $3) RETURNING id, file_name, created_at',
                    [userId, fileName, jsonData]
                );
                createdDatasets.push(newDataset.rows[0]);

            } catch (sheetError) {
                console.error(`Error procesando la hoja '${worksheet.name}':`, sheetError.message);
            }
        }

        return createdDatasets;

    } catch (error) {
        console.error("Error en la importación de datos del BCV:", error.code || error.message);
        throw new Error('Falló la importación de datos desde el BCV.');
    }
};

// --- NUEVO IMPORTADOR INTELIGENTE PARA SERIES DE TIEMPO ---

/**
 * Extrae los datos clave (fechas y tasa USD) de una sola hoja de cálculo.
 * VERSIÓN CORREGIDA Y DEFINITIVA
 * @param {object} worksheet - El objeto de la hoja de cálculo parseado por node-xlsx.
 * @returns {object|null} Un objeto con { fecha_operacion, fecha_valor, tasa_usd } o null si no se encuentran los datos.
 */
function extractKeyDataFromSheet(worksheet) {
    const data = worksheet.data;
    let result = {
        fecha_operacion: null,
        fecha_valor: null,
        tasa_usd: null,
    };

    // 1. Encontrar la fila que contiene las fechas
    const fechaRow = data.find(row => row && row.some(cell => typeof cell === 'string' && cell.includes('Fecha Operacion:')));

    if (fechaRow) {
        // --- LÓGICA CORREGIDA ---
        // Buscar la celda que contiene el texto y luego extraer la fecha de ella.
        const cellOperacion = fechaRow.find(cell => typeof cell === 'string' && cell.includes('Fecha Operacion:'));
        if (cellOperacion) {
            // Dividimos el string "Fecha Operacion: DD/MM/YYYY" por el ": " y tomamos la segunda parte.
            result.fecha_operacion = cellOperacion.split(':')[1]?.trim() || null;
        }

        const cellValor = fechaRow.find(cell => typeof cell === 'string' && cell.includes('Fecha Valor:'));
        if (cellValor) {
            result.fecha_valor = cellValor.split(':')[1]?.trim() || null;
        }
    }

    // 2. Encontrar la tasa del USD (esta parte ya funcionaba bien)
    const usdRow = data.find(row => row && row[0] === 'USD');
    if (usdRow && usdRow[5]) { // El índice 5 es la 6ta columna "Venta (ASK)" para Bs./M.E.
        let tasa = String(usdRow[5]).replace(',', '.'); // Reemplazar coma por punto para el parseo
        result.tasa_usd = parseFloat(tasa) || 0;
    }

    // 3. Devolvemos el objeto solo si encontramos los 3 datos clave.
    if (result.fecha_operacion && result.fecha_valor && result.tasa_usd) {
        return result;
    }

    // Si después de todo el proceso falta algún dato, retornamos null para ignorar esta hoja.
    return null;
}

/**
 * Orquesta la importación de la serie de tiempo del dólar.
 * @param {number} userId - El ID del usuario.
 * @returns {Promise<object>} El nuevo dataset consolidado que se creó.
 */
export const importBCVTimeSeriesData = async (userId) => {
    const url = 'https://www.bcv.org.ve/sites/default/files/EstadisticasGeneral/2_1_2b25_smc.xls';

    try {
        const agent = new https.Agent({ rejectUnauthorized: false });
        const response = await axios.get(url, { responseType: 'arraybuffer', httpsAgent: agent });
        const worksheets = xlsx.parse(response.data);

        if (!worksheets || worksheets.length === 0) {
            throw new Error('El archivo Excel está vacío o corrupto.');
        }

        const allKeyData = [];
        for (const worksheet of worksheets) {
            const keyData = extractKeyDataFromSheet(worksheet);
            if (keyData) {
                allKeyData.push(keyData);
            }
        }

        if (allKeyData.length === 0) {
            throw new Error('No se pudo extraer ningún dato clave del archivo del BCV.');
        }

        // Ordenar los datos por fecha de operación para que la serie de tiempo sea coherente
        allKeyData.sort((a, b) => {
            // Helper para convertir "DD/MM/YYYY" a un objeto Date confiable
            const parseDate = (dateString) => {
                const [day, month, year] = dateString.split('/');
                return new Date(`${year}-${month}-${day}`);
            };

            const dateA = parseDate(a.fecha_operacion);
            const dateB = parseDate(b.fecha_operacion);

            return dateB - dateA; // Ordena de más reciente a más antiguo
        });

        // Guardar el array consolidado como un único dataset
        const jsonData = JSON.stringify(allKeyData);
        const fileName = `BCV_Historico_Tasa_USD.xls`; // Un nombre de archivo fijo para este tipo de dataset

        // Antes de insertar, podríamos borrar un dataset anterior con el mismo nombre para no crear duplicados
        await db.query('DELETE FROM datasets WHERE user_id = $1 AND file_name = $2', [userId, fileName]);

        const newDataset = await db.query(
            'INSERT INTO datasets (user_id, file_name, data_json) VALUES ($1, $2, $3) RETURNING id, file_name, created_at',
            [userId, fileName, jsonData]
        );

        return newDataset.rows[0];

    } catch (error) {
        console.error("Error en la importación de series de tiempo del BCV:", error.message);
        throw new Error('Falló la importación de la serie de tiempo desde el BCV.');
    }
};