/**
 * ============================================================================
 * ARCHIVO: reportsController.js - CONTROLADOR DE REPORTES
 * ============================================================================
 * 
 * Este archivo contiene el "Controller" para los endpoints de reportes.
 * 
 * ¿QUÉ ES UN CONTROLLER?
 * Es una función que:
 * 1. Recibe la petición HTTP (req)
 * 2. Llama al servicio correspondiente
 * 3. Formatea y envía la respuesta (res)
 * 
 * ¿POR QUÉ SEPARAR CONTROLLERS DE RUTAS?
 * - Las rutas definen "cuáles" endpoints existen
 * - Los controllers definen "qué hacer" en cada endpoint
 * - Los servicios hacen el "trabajo real" con la base de datos
 * 
 * FLUJO COMPLETO DE UNA PETICIÓN:
 * 
 * Cliente (Postman) 
 *     ↓ GET /api/reports/tuition-revenue
 * app.js (encuentra la ruta)
 *     ↓
 * routes/reports.js (dirige al controller)
 *     ↓
 * controller/reportsController.js (maneja req/res) ← ESTAMOS AQUÍ
 *     ↓
 * services/reportsServices.js (consulta la BD)
 *     ↓
 * PostgreSQL (ejecuta la query)
 *     ↓ (resultado)
 * Cliente recibe JSON
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

// Importamos la función del servicio que hace la consulta real
import { getReport } from "../services/reportsServices.js";

// ============================================================================
// CONTROLLER: getReportEndpoint
// ============================================================================

/**
 * getReportEndpoint - Maneja la petición GET /api/reports/tuition-revenue
 * 
 * @param {Object} req - Request (petición del cliente)
 *   - req.params: parámetros de la URL (/:id)
 *   - req.query: query strings (?nombre=valor)
 *   - req.body: cuerpo de la petición (para POST/PUT/PATCH)
 *   - req.headers: encabezados HTTP
 * 
 * @param {Object} res - Response (objeto para responder al cliente)
 *   - res.status(código): establece código HTTP
 *   - res.json(objeto): envía respuesta JSON
 *   - res.send(texto): envía respuesta texto
 * 
 * CÓDIGOS HTTP COMUNES:
 * - 200: OK (éxito)
 * - 201: Created (recurso creado)
 * - 400: Bad Request (petición mal formada)
 * - 401: Unauthorized (no autenticado)
 * - 403: Forbidden (sin permisos)
 * - 404: Not Found (no existe)
 * - 500: Internal Server Error (error del servidor)
 */
const getReportEndpoint = async (req, res) => {
    try {
        // Llamamos al servicio que ejecuta la consulta SQL
        const report = await getReport();
        
        // Respondemos con código 200 (OK) y el reporte en JSON
        res.status(200).json({
            message: 'Reporte obtenido exitosamente',
            report
        });
        
    } catch (error) {
        // Si hay error, respondemos con código 500 (Error del servidor)
        res.status(500).json({
            message: 'Error al obtener el reporte',
            error: error.message
        });
    }
};

// Exportamos el controller para usarlo en las rutas
export default getReportEndpoint;

/**
 * ============================================================================
 * ¿CÓMO CREAR UN NUEVO CONTROLLER?
 * ============================================================================
 * 
 * Ejemplo: Controller para obtener estudiantes morosos
 * 
 * 1. Crea el archivo: src/controller/studentsController.js
 * 
 * 2. Escribe el controller:
 * 
 *    import { getDebtorStudents } from "../services/studentsServices.js";
 *    
 *    export const getDebtorsEndpoint = async (req, res) => {
 *        try {
 *            // Puedes usar query params para filtrar
 *            const { minDebt } = req.query;  // ?minDebt=500000
 *            
 *            const debtors = await getDebtorStudents(minDebt);
 *            
 *            if (debtors.length === 0) {
 *                return res.status(404).json({ 
 *                    message: 'No se encontraron estudiantes morosos' 
 *                });
 *            }
 *            
 *            res.status(200).json({
 *                message: 'Estudiantes morosos encontrados',
 *                count: debtors.length,
 *                debtors
 *            });
 *            
 *        } catch (error) {
 *            res.status(500).json({ error: error.message });
 *        }
 *    };
 * 
 * 3. Úsalo en las rutas:
 *    import { getDebtorsEndpoint } from '../controller/studentsController.js';
 *    router.get('/debtors', getDebtorsEndpoint);
 */