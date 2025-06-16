import db from '../db/index.js';

// Obtiene el dashboard principal con todos sus gráficos y datos
export const getMainDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Encontrar el dashboard principal del usuario (o crearlo)
        let dashboard = await db.query('SELECT * FROM dashboards WHERE user_id = $1 LIMIT 1', [userId]);
        if (dashboard.rows.length === 0) {
            dashboard = await db.query('INSERT INTO dashboards (user_id, name, layout) VALUES ($1, $2, $3) RETURNING *', [userId, 'Dashboard Principal', '[]']);
        }

        const dashboardData = dashboard.rows[0];

        // 2. Consulta SQL compleja para traer todas las visualizaciones y sus datos de dataset
        const vizQuery = `
      SELECT 
        v.id, v.name, v.chart_type, v.config,
        d.data_json
      FROM visualizations v
      JOIN dashboard_visualizations dv ON v.id = dv.visualization_id
      JOIN datasets d ON v.dataset_id = d.id
      WHERE dv.dashboard_id = $1
    `;

        const visualizationsResult = await db.query(vizQuery, [dashboardData.id]);

        // 3. Adjuntar las visualizaciones a la respuesta del dashboard
        dashboardData.visualizations = visualizationsResult.rows;

        res.status(200).json(dashboardData);
    } catch (error) {
        console.error("Error obteniendo el dashboard:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Actualizar la disposición (layout) del dashboard
export const updateLayout = async (req, res) => {
    try {
        const userId = req.user.id;
        const { layout } = req.body;

        // Actualizar el layout del dashboard principal del usuario
        await db.query(
            'UPDATE dashboards SET layout = $1 WHERE user_id = $2',
            [JSON.stringify(layout), userId]
        );

        res.status(200).json({ message: 'Layout actualizado con éxito.' });
    } catch (error) {
        console.error("Error actualizando el layout:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};