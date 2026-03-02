/**
 * ============================================================================
 * ARCHIVO: app.js - CONFIGURACIÓN DE EXPRESS Y RUTAS
 * ============================================================================
 * 
 * Este archivo configura la aplicación Express y conecta todas las rutas.
 * Piensa en Express como un "cartero" que recibe peticiones HTTP y las
 * envía al lugar correcto según la URL.
 * 
 * ANALOGÍA:
 * - Express es como la recepción de un edificio
 * - Las rutas son como los departamentos del edificio
 * - Cuando llega una petición, Express la dirige al departamento correcto
 * 
 * ¿CÓMO AGREGAR UN NUEVO ENDPOINT?
 * 1. Crea un archivo en /routes (ej: students.js)
 * 2. Importa el router aquí: import studentsRouter from "./routes/students.js"
 * 3. Usa el router: app.use('/api/students', studentsRouter)
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

// Express es el framework web más popular de Node.js
// Nos permite crear servidores HTTP fácilmente
import express from "express";

// Importamos los "routers" - cada uno maneja un grupo de endpoints relacionados
// migrateRouter maneja todo lo relacionado con migración de datos
import migrateRouter from "./routes/migrate.js";

// coursesRouter maneja todo lo relacionado con cursos (CRUD)
import coursesRouter from "./routes/courses.js";

// reportsRouter maneja los reportes financieros
import reportsRouter from "./routes/reports.js";

// studentsRouter maneja consultas de estudiantes y Kardex académico
import studentsRouter from "./routes/students.js";

// ============================================================================
// CREACIÓN DE LA APLICACIÓN EXPRESS
// ============================================================================

/**
 * express() crea una instancia de la aplicación.
 * 'export' hace que podamos importar 'app' desde otros archivos (como server.js)
 */
export const app = express();

// ============================================================================
// MIDDLEWARES - Funciones que procesan TODAS las peticiones
// ============================================================================

/**
 * express.json() es un middleware que:
 * - Lee el cuerpo (body) de las peticiones que llegan en formato JSON
 * - Lo convierte en un objeto JavaScript accesible en req.body
 * 
 * Sin esto, si envías {"name": "Juan"} en una petición POST,
 * no podrías acceder a req.body.name
 */
app.use(express.json());

// ============================================================================
// REGISTRO DE RUTAS - Conectamos cada "departamento" de la API
// ============================================================================

/**
 * app.use(ruta_base, router) conecta un router a una ruta base.
 * 
 * EJEMPLO: Si migrateRouter tiene una ruta POST '/migrate',
 * la URL completa será: POST /api/simulacro/migrate
 * 
 * Es como decir: "Todo lo que empiece con /api/simulacro, 
 * envíalo al migrateRouter para que lo maneje"
 */

// Rutas de migración: /api/simulacro/...
app.use('/api/simulacro', migrateRouter);

// Rutas de cursos: /api/courses/...
app.use('/api/courses', coursesRouter);

// Rutas de reportes: /api/reports/...
app.use('/api/reports', reportsRouter);

// Rutas de estudiantes: /api/students/...
// Incluye el endpoint del Kardex: GET /api/students/:email/transcript
app.use('/api/students', studentsRouter);

/**
 * ============================================================================
 * ¿QUIERES AGREGAR MÁS RUTAS? SIGUE ESTE PATRÓN:
 * ============================================================================
 * 
 * 1. Crea el archivo de rutas:
 *    src/routes/students.js
 * 
 * 2. Importa aquí:
 *    import studentsRouter from "./routes/students.js";
 * 
 * 3. Registra la ruta:
 *    app.use('/api/students', studentsRouter);
 * 
 * ¡Listo! Ahora tienes endpoints en /api/students/...
 */
