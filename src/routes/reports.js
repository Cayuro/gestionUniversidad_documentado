/**
 * ============================================================================
 * ARCHIVO: reports.js - RUTAS DE REPORTES FINANCIEROS
 * ============================================================================
 * 
 * Este archivo define los endpoints para obtener reportes.
 * 
 * ENDPOINTS DISPONIBLES:
 * GET /api/reports/tuition-revenue - Reporte de ingresos por matrícula por facultad
 * 
 * PATRÓN USADO: Controller
 * A diferencia de courses.js donde la lógica está directamente en la ruta,
 * aquí usamos un "Controller" que es otro archivo que maneja la lógica.
 * 
 * FLUJO:
 * Petición → Ruta (reports.js) → Controller (reporstController.js) → Servicio (reportsServices.js)
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

// Importamos el CONTROLLER que maneja la lógica del endpoint
// El controller llama al servicio y maneja la respuesta HTTP
import getReportEndpoint from '../controller/reporstController.js';

import { Router } from 'express';

// ============================================================================
// CREACIÓN DEL ROUTER
// ============================================================================

const router = Router();

// ============================================================================
// DEFINICIÓN DE RUTAS
// ============================================================================

/**
 * GET /tuition-revenue - Reporte de ingresos por matrícula
 * 
 * Retorna el total recaudado agrupado por facultad/departamento.
 * 
 * EJEMPLO DE RESPUESTA:
 * {
 *   "message": "Report retrieved successfully",
 *   "report": [
 *     { "facultad": "Ingeniería", "totalrecaudo": "4800000" },
 *     { "facultad": "Humanidades", "totalrecaudo": "2400000" }
 *   ]
 * }
 * 
 * ¿POR QUÉ NO HAY LÓGICA AQUÍ?
 * Porque usamos el patrón Controller.
 * getReportEndpoint es una función que recibe (req, res) y maneja todo.
 * Esto hace las rutas más limpias cuando hay mucha lógica.
 */
router.get('/tuition-revenue', getReportEndpoint);

// Exportamos el router
export default router;

/**
 * ============================================================================
 * COMPARACIÓN: RUTAS vs CONTROLLERS
 * ============================================================================
 * 
 * OPCIÓN 1: Lógica directo en la ruta (como courses.js)
 * + Más simple para endpoints pequeños
 * + Menos archivos
 * - Se vuelve desordenado con mucha lógica
 * 
 * router.get('/algo', async (req, res) => {
 *     // toda la lógica aquí
 * });
 * 
 * OPCIÓN 2: Usar Controllers (como este archivo)
 * + Más organizado
 * + Más fácil de testear
 * + Separa responsabilidades
 * - Más archivos que mantener
 * 
 * router.get('/algo', miControllerFunction);
 * 
 * RECOMENDACIÓN:
 * - Endpoints simples → lógica en la ruta
 * - Endpoints complejos → usar controllers
 */