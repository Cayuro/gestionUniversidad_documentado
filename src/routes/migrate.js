/**
 * ============================================================================
 * ARCHIVO: migrate.js - RUTAS DE MIGRACIÓN DE DATOS
 * ============================================================================
 * 
 * Este archivo define el endpoint para migrar datos del CSV a las bases de datos.
 * 
 * ¿QUÉ ES UNA RUTA (ROUTE)?
 * Es la definición de qué hacer cuando alguien hace una petición HTTP
 * a una URL específica. Define:
 * - El MÉTODO HTTP (GET, POST, PUT, DELETE, PATCH)
 * - La URL (/migrate)
 * - Qué función ejecutar cuando llegue esa petición
 * 
 * ENDPOINT DISPONIBLE:
 * POST /api/simulacro/migrate - Ejecuta la migración de datos
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

// Router de Express - nos permite definir rutas modulares
import { Router } from "express";

// Función que ejecuta la migración (lee CSV, inserta en PostgreSQL y MongoDB)
import { migrateData } from "../config/postgres.js";

// ============================================================================
// CREACIÓN DEL ROUTER
// ============================================================================

/**
 * Router() crea un mini-aplicación de Express donde podemos definir rutas.
 * Luego este router se "monta" en app.js con app.use('/api/simulacro', router)
 */
const router = Router();

// ============================================================================
// DEFINICIÓN DE RUTAS
// ============================================================================

/**
 * POST /migrate - Ejecuta la migración de datos
 * 
 * ¿POR QUÉ POST?
 * Usamos POST porque esta operación CREA datos en las bases de datos.
 * Los métodos HTTP tienen significados:
 * - GET = obtener/leer datos (sin modificar nada)
 * - POST = crear nuevos datos
 * - PUT = reemplazar datos existentes completamente
 * - PATCH = modificar parcialmente datos existentes
 * - DELETE = eliminar datos
 * 
 * PARÁMETROS:
 * - req (request) = la petición que llega del cliente (Postman, frontend, etc.)
 * - res (response) = el objeto para enviar respuesta al cliente
 * 
 * EJEMPLO DE USO CON POSTMAN:
 * Método: POST
 * URL: http://localhost:3000/api/simulacro/migrate
 * Body: (vacío, no se necesita enviar datos)
 */
router.post('/migrate', async (req, res) => {
    try {
        // Ejecutamos la migración y obtenemos contadores
        // counters tendrá: { contStudents: 5, contCourses: 8, contProfessors: 4, ... }
        const counters = await migrateData();
        
        // Enviamos respuesta exitosa (código 200 = OK)
        // res.json() convierte el objeto a JSON y lo envía al cliente
        res.status(200).json({
            message: 'Migración completada exitosamente',
            counters  // Incluimos las estadísticas de la migración
        });
        
    } catch (error) {
        // Si algo falla, enviamos error (código 500 = Error interno del servidor)
        res.status(500).json({
            message: 'Error durante la migración',
            error: error.message
        });
    }
});

// ============================================================================
// EXPORTACIÓN
// ============================================================================

/**
 * Exportamos el router para usarlo en app.js
 * Allá se monta con: app.use('/api/simulacro', migrateRouter)
 */
export default router;

/**
 * ============================================================================
 * ¿CÓMO AGREGAR OTRO ENDPOINT A ESTE ROUTER?
 * ============================================================================
 * 
 * Ejemplo: Agregar un endpoint para ver el estado de la última migración
 * 
 * router.get('/status', async (req, res) => {
 *     try {
 *         // Lógica para obtener el estado
 *         const status = await getMigrationStatus();
 *         res.status(200).json({ status });
 *     } catch (error) {
 *         res.status(500).json({ error: error.message });
 *     }
 * });
 * 
 * Esto crearía el endpoint: GET /api/simulacro/status
 */