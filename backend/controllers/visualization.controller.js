// backend/controllers/visualization.controller.js
import db from '../db/index.js';

export const createVisualization = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, chart_type, dataset_id, config } = req.body;

    if (!name || !chart_type || !dataset_id || !config) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    const newVisualization = await db.query(
      'INSERT INTO visualizations (user_id, dataset_id, name, chart_type, config) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, dataset_id, name, chart_type, JSON.stringify(config)]
    );

    res.status(201).json(newVisualization.rows[0]);
    try {
      const userId = req.user.id;
      const visualizationId = newVisualization.rows[0].id;

      // Buscar el dashboard principal del usuario (o crear uno si no existe)
      let dashboard = await db.query('SELECT * FROM dashboards WHERE user_id = $1 LIMIT 1', [userId]);

      if (dashboard.rows.length === 0) {
        dashboard = await db.query('INSERT INTO dashboards (user_id, name) VALUES ($1, $2) RETURNING *', [userId, 'Dashboard Principal']);
      }

      const dashboardId = dashboard.rows[0].id;

      // Añadir la nueva visualización al dashboard
      await db.query('INSERT INTO dashboard_visualizations (dashboard_id, visualization_id) VALUES ($1, $2)', [dashboardId, visualizationId]);

    } catch (linkError) {
      console.error("Error al enlazar la visualización al dashboard:", linkError);
      // No enviamos un error al cliente, ya que la visualización principal se creó bien.
      // Esto es una mejora de fondo.
    }
  } catch (error) {
    console.error("Error creando la visualización:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const deleteVisualization = async (req, res) => {
  try {
    const userId = req.user.id;
    const vizId = req.params.id;

    // Primero, la borramos de cualquier dashboard al que esté asociada
    await db.query('DELETE FROM dashboard_visualizations WHERE visualization_id = $1', [vizId]);

    // Luego, borramos la visualización en sí, asegurándonos de que pertenece al usuario
    const deleteResult = await db.query(
      'DELETE FROM visualizations WHERE id = $1 AND user_id = $2',
      [vizId, userId]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: 'Visualización no encontrada o no tienes permiso.' });
    }

    res.status(200).json({ message: 'Visualización eliminada exitosamente.' });
  } catch (error) {
    console.error("Error eliminando la visualización:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const deleteMultipleVisualizations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ids } = req.body; // Esperamos un array de IDs: { ids: [1, 2, 3] }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Se requiere un array de IDs.' });
    }

    // Usamos ANY($1::int[]) para buscar en el array de IDs de forma segura

    // Primero, las borramos de cualquier dashboard al que estén asociadas
    await db.query('DELETE FROM dashboard_visualizations WHERE visualization_id = ANY($1::int[])', [ids]);

    // Luego, borramos las visualizaciones, asegurándonos de que pertenecen al usuario
    const deleteResult = await db.query(
      'DELETE FROM visualizations WHERE id = ANY($1::int[]) AND user_id = $2',
      [ids, userId]
    );

    res.status(200).json({ message: `${deleteResult.rowCount} visualizaciones eliminadas exitosamente.` });

  } catch (error) {
    console.error("Error en la eliminación múltiple:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};