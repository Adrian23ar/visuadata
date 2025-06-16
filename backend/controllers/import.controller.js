// backend/controllers/import.controller.js
import { importBCVData, importBCVTimeSeriesData } from '../importers/bcvImporter.js';

export const runBCVImport = async (req, res) => {
    try {
        const userId = req.user.id;
        const newDatasets = await importBCVData(userId); // Ahora devuelve un array

        // Enviamos una respuesta que indica cuántos datasets se importaron
        res.status(201).json({
            message: `Importación completada. Se crearon ${newDatasets.length} nuevos datasets.`,
            datasets: newDatasets
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const runBCVTimeSeriesImport = async (req, res) => {
    try {
        const userId = req.user.id;
        const newDataset = await importBCVTimeSeriesData(userId);
        res.status(201).json({
            message: 'Serie de tiempo del BCV importada con éxito.',
            dataset: newDataset
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};