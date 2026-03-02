/**
 * ============================================================================
 * ARCHIVO: courses.js - RUTAS CRUD PARA CURSOS
 * ============================================================================
 * 
 * Este archivo define los endpoints para gestionar cursos.
 * Implementa un CRUD parcial (Create-Read-Update-Delete).
 * 
 * ENDPOINTS DISPONIBLES:
 * GET    /api/courses          - Obtener todos los cursos
 * GET    /api/courses/:code    - Obtener un curso específico por su código
 * PATCH  /api/courses/:code    - Actualizar parcialmente un curso
 * 
 * NOTA: Falta implementar POST (crear) y DELETE (eliminar)
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

import { Router } from "express";

// Importamos las funciones de servicio que contienen la lógica de negocio
// Separar rutas de servicios hace el código más organizado y testeable
import { getCourses, getCoursesByCode, updateCourseByCode } from "../services/coursesServices.js";

// Creamos el router
const router = Router();

// ============================================================================
// GET / - OBTENER TODOS LOS CURSOS
// ============================================================================

/**
 * Endpoint: GET /api/courses
 * 
 * Retorna una lista de todos los cursos disponibles.
 * 
 * EJEMPLO DE RESPUESTA:
 * {
 *   "message": "Courses get successfully",
 *   "courses": [
 *     { "code": "CS101", "name": "Programación", "credits": 4, "profesor_name": "Dr. Silva" },
 *     { "code": "MAT201", "name": "Cálculo", "credits": 4, "profesor_name": "Dr. Ruiz" }
 *   ]
 * }
 */
router.get('/', async (req, res) => {
    try {
        // Llamamos al servicio que hace la consulta a PostgreSQL
        const courses = await getCourses();
        
        // Respondemos con código 200 (OK) y los cursos en formato JSON
        res.status(200).json({
            message: 'Cursos obtenidos exitosamente',
            courses
        });
        
    } catch (error) {
        // Si hay error, respondemos con código 500 (Error del servidor)
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /:code - OBTENER UN CURSO POR SU CÓDIGO
// ============================================================================

/**
 * Endpoint: GET /api/courses/:code
 * 
 * :code es un PARÁMETRO DE RUTA (route parameter)
 * El valor que pongas en la URL se captura en req.params.code
 * 
 * EJEMPLO:
 * GET /api/courses/CS101  →  req.params.code = "CS101"
 * GET /api/courses/MAT201 →  req.params.code = "MAT201"
 * 
 * CÓDIGOS DE RESPUESTA:
 * 200 = Curso encontrado
 * 404 = Curso no encontrado (Not Found)
 * 500 = Error del servidor
 */
router.get('/:code', async (req, res) => {
    // Extraemos el código de los parámetros de la URL
    // Esto usa "destructuring" de JavaScript: { code } = { code: "CS101" }
    const { code } = req.params;
    
    try {
        // Buscamos el curso por su código
        const course = await getCoursesByCode(code);
        
        // Si no existe, retornamos 404 (No encontrado)
        if (!course) {
            return res.status(404).json({ message: "Curso no encontrado" });
        }
        
        // Si existe, lo retornamos con código 200
        res.status(200).json({
            message: 'Curso obtenido exitosamente',
            course
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// PATCH /:code - ACTUALIZAR PARCIALMENTE UN CURSO
 // ============================================================================

/**
 * Endpoint: PATCH /api/courses/:code
 * 
 * PATCH vs PUT:
 * - PUT reemplaza TODO el recurso (debes enviar todos los campos)
 * - PATCH modifica SOLO los campos que envías (actualización parcial)
 * 
 * EJEMPLO DE USO CON POSTMAN:
 * Método: PATCH
 * URL: http://localhost:3000/api/courses/CS101
 * Body (raw JSON):
 * {
 *   "name": "Programación Avanzada",
 *   "credits": 5
 * }
 * 
 * Esto actualiza SOLO el nombre y créditos, deja el profesor igual.
 */
router.patch('/:code', async (req, res) => {
    const { code } = req.params;
    
    try {
        // req.body contiene los datos enviados en el cuerpo de la petición
        // Solo se actualizarán los campos que vengan en el body
        await updateCourseByCode(req.body, code);
        
        res.status(200).json({ message: "Curso actualizado exitosamente" });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Exportamos el router
export default router;

/**
 * ============================================================================
 * EJERCICIO: ¿CÓMO AGREGARÍAS UN ENDPOINT DELETE?
 * ============================================================================
 * 
 * router.delete('/:code', async (req, res) => {
 *     const { code } = req.params;
 *     
 *     try {
 *         // 1. Verificar si el curso existe
 *         const course = await getCoursesByCode(code);
 *         if (!course) {
 *             return res.status(404).json({ message: "Curso no encontrado" });
 *         }
 *         
 *         // 2. Eliminar el curso (crearías deleteCourseByCode en el servicio)
 *         await deleteCourseByCode(code);
 *         
 *         // 3. Responder con 200 o 204 (No Content)
 *         res.status(200).json({ message: "Curso eliminado" });
 *         
 *     } catch (error) {
 *         res.status(500).json({ error: error.message });
 *     }
 * });
 */