# VisuaData 📊

VisuaData es una plataforma web full-stack interactiva para la visualización y análisis de datos. Permite a los usuarios subir sus propios conjuntos de datos (CSV/XLS), importar datos de fuentes externas, crear visualizaciones personalizadas (gráficos de barras, líneas, tablas) y organizarlas en un dashboard interactivo y responsive.

## ✨ Características Principales

  * **Autenticación Segura:** Sistema completo de registro e inicio de sesión de usuarios usando JWT en cookies HttpOnly.
  * **Gestión de Datasets:**
      * Subida manual de archivos `.csv`, `.xls` y `.xlsx`.
      * Procesamiento inteligente de archivos con formatos no estructurados.
      * Importación automática de datos desde fuentes externas (ej. tasas de cambio del BCV).
      * Creación de datasets consolidados (series de tiempo).
      * Eliminación individual y múltiple de datasets.
  * **Creación de Visualizaciones:**
      * Interfaz para crear gráficos de **barras**, **líneas** y **tablas** a partir de los datos.
      * Selección dinámica de ejes y columnas.
      * Vista previa en tiempo real del gráfico configurado.
  * **Dashboard Interactivo:**
      * Grid responsive que permite arrastrar, soltar y redimensionar los widgets de visualización.
      * El layout del dashboard se guarda automáticamente.
      * Eliminación de visualizaciones directamente desde el dashboard.
  * **Diseño Moderno y Responsive:**
      * Tema oscuro diseñado para la comodidad visual.
      * Interfaz adaptable a dispositivos de escritorio y móviles.
      * Layout profesional con sidebar de navegación persistente.

## 🛠️ Tecnologías Utilizadas

| Área | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | Vue.js 3 | Framework principal (Composition API) |
| | Vite | Herramienta de compilación y servidor de desarrollo |
| | Vue Router | Enrutamiento del lado del cliente |
| | Pinia | Gestor de estado |
| | Tailwind CSS | Framework de CSS para estilos |
| | Chart.js | Creación de gráficos interactivos |
| | `vue-grid-layout-next` | Grid del dashboard interactivo |
| | Axios | Cliente HTTP para peticiones a la API |
| **Backend** | Node.js | Entorno de ejecución |
| | Express.js | Framework para el servidor y la API REST |
| | PostgreSQL | Base de datos relacional |
| | JWT (JSON Web Tokens) | Autenticación y manejo de sesiones |
| | `node-xlsx` | Lectura y parseo de archivos Excel |
| | `papaparse` | Lectura y parseo de archivos CSV |

## 🚀 Puesta en Marcha Local

Sigue estos pasos para levantar el proyecto en tu máquina local.

### **Prerrequisitos**

  * [Node.js](https://nodejs.org/) (v18 o superior)
  * [npm](https://www.npmjs.com/) (usualmente viene con Node.js)
  * [PostgreSQL](https://www.postgresql.org/download/) instalado y corriendo localmente.
  * [Git](https://git-scm.com/downloads)

### **Instalación**

1.  **Clona el repositorio:**

    ```bash
    git clone https://github.com/tu-usuario/visuadata.git
    cd visuadata
    ```

2.  **Configura el Backend:**

    ```bash
    # Navega a la carpeta del backend
    cd backend

    # Instala las dependencias
    npm install

    # Crea el archivo de variables de entorno
    # Copia el contenido de .env.example (si lo tienes) o crea un .env y llénalo
    cp .env.example .env 
    ```

    Tu archivo `.env` debe contener:

    ```
    PORT=5000
    DB_USER=postgres
    DB_HOST=localhost
    DB_DATABASE=visuadata
    DB_PASSWORD=tu_contraseña_secreta
    DB_PORT=5432
    JWT_SECRET=un_secreto_muy_largo_y_seguro_para_desarrollo
    ```

    ```bash
    # Crea las tablas en tu base de datos PostgreSQL
    node db/init.js

    # Inicia el servidor de desarrollo del backend
    npm run dev
    ```

    El backend estará corriendo en `http://localhost:5000`.

3.  **Configura el Frontend:**
    (Abre una nueva terminal)

    ```bash
    # Navega a la carpeta del frontend
    cd frontend

    # Instala las dependencias
    npm install

    # Inicia el servidor de desarrollo del frontend
    npm run dev
    ```

    La aplicación estará disponible en `http://localhost:5173` (o el puerto que indique Vite).

¡Y listo\! Ya puedes usar la aplicación en tu entorno local.
