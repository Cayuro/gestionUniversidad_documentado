/**
 * ============================================================================
 * ARCHIVO: students.js - RUTAS PARA GESTIÓN DE ESTUDIANTES
 * ============================================================================
 * 
 * Este archivo define los endpoints para consultar información de estudiantes.
 * El endpoint principal es el Kardex (historial académico) que consulta MongoDB.
 * 
 * ENDPOINTS DISPONIBLES:
 * GET /api/students                    → Lista todos los estudiantes
 * GET /api/students/:email             → Obtiene datos básicos de un estudiante
 * GET /api/students/:email/transcript  → Obtiene el Kardex completo (MongoDB)
 * GET /api/students/:email/enrollments → Obtiene inscripciones desde SQL
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

import { Router } from "express";

// Importamos las funciones del servicio de estudiantes
import { 
    getTranscriptByEmail, 
    getAllStudents, 
    getStudentByEmail,
    getStudentEnrollments 
} from "../services/studentsService.js";

// ============================================================================
// CREACIÓN DEL ROUTER
// ============================================================================

const router = Router();

// ============================================================================
// GET / - OBTENER TODOS LOS ESTUDIANTES
// ============================================================================

/**
 * Endpoint: GET /api/students
 * 
 * Lista todos los estudiantes registrados en PostgreSQL.
 * Útil para un dropdown de selección o listado general.
 * 
 * EJEMPLO DE RESPUESTA:
 * {
 *   "message": "Estudiantes obtenidos exitosamente",
 *   "count": 150,
 *   "students": [
 *     { "id": 1, "name": "Juan Perez", "email": "j.perez@unigestion.edu", "phone": "3001234567" },
 *     ...
 *   ]
 * }
 */
router.get('/', async (req, res) => {
    try {
        const students = await getAllStudents();
        
        res.status(200).json({
            message: 'Estudiantes obtenidos exitosamente',
            count: students.length,
            students
        });
        
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener estudiantes',
            error: error.message 
        });
    }
});

// ============================================================================
// GET /:email/transcript - OBTENER KARDEX ACADÉMICO (MONGODB)
// ============================================================================

/**
 * Endpoint: GET /api/students/:email/transcript
 * 
 * Este es el endpoint principal para consultar el historial académico.
 * Consulta MongoDB directamente, lo que debe ser muy rápido (<100ms).
 * 
 * PARÁMETROS:
 * - email: Email del estudiante en la URL
 * 
 * EJEMPLO:
 * GET /api/students/j.perez@unigestion.edu/transcript
 * 
 * RESPUESTA EXITOSA (200):
 * {
 *   "message": "Kardex obtenido exitosamente",
 *   "transcript": {
 *     "studentEmail": "j.perez@unigestion.edu",
 *     "studentName": "Juan Perez",
 *     "academicHistory": [...],
 *     "summary": { "totalCreditsEarned": 24, "averageGrade": 4.2 }
 *   }
 * }
 * 
 * RESPUESTA NO ENCONTRADO (404):
 * { "message": "Estudiante no encontrado" }
 */
router.get('/:email/transcript', async (req, res) => {
    const { email } = req.params;
    
    try {
        // Medimos el tiempo de respuesta para verificar que sea <100ms
        const startTime = Date.now();
        
        const transcript = await getTranscriptByEmail(email);
        
        const responseTime = Date.now() - startTime;
        
        // Si no existe el estudiante, retornamos 404
        if (!transcript) {
            return res.status(404).json({ 
                message: 'Estudiante no encontrado',
                searchedEmail: email 
            });
        }
        
        // Respuesta exitosa con el Kardex completo
        res.status(200).json({
            message: 'Kardex obtenido exitosamente',
            responseTimeMs: responseTime,  // Para verificar el requisito de <100ms
            transcript
        });
        
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener el kardex',
            error: error.message 
        });
    }
});

// ============================================================================
// GET /:email - OBTENER DATOS BÁSICOS DE UN ESTUDIANTE
// ============================================================================

/**
 * Endpoint: GET /api/students/:email
 * 
 * Obtiene solo los datos básicos del estudiante desde PostgreSQL.
 * NO incluye el historial académico, solo: id, name, email, phone.
 * 
 * NOTA: Este endpoint debe ir DESPUÉS de /:email/transcript
 * para que Express no lo confunda con "transcript" como email.
 */
router.get('/:email', async (req, res) => {
    const { email } = req.params;
    
    try {
        const student = await getStudentByEmail(email);
        
        if (!student) {
            return res.status(404).json({ 
                message: 'Estudiante no encontrado' 
            });
        }
        
        res.status(200).json({
            message: 'Estudiante obtenido exitosamente',
            student
        });
        
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener estudiante',
            error: error.message 
        });
    }
});

// ============================================================================
// GET /:email/enrollments - OBTENER INSCRIPCIONES DESDE SQL
// ============================================================================

/**
 * Endpoint: GET /api/students/:email/enrollments
 * 
 * Alternativa al Kardex: obtiene las inscripciones directamente de PostgreSQL.
 * Es más lento (requiere JOINs) pero siempre tiene datos actualizados.
 * 
 * Útil si sospechas que el Kardex de MongoDB está desactualizado.
 */
router.get('/:email/enrollments', async (req, res) => {
    const { email } = req.params;
    
    try {
        const enrollments = await getStudentEnrollments(email);
        
        if (enrollments.length === 0) {
            return res.status(404).json({ 
                message: 'No se encontraron inscripciones para este estudiante' 
            });
        }
        
        res.status(200).json({
            message: 'Inscripciones obtenidas exitosamente',
            count: enrollments.length,
            enrollments
        });
        
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener inscripciones',
            error: error.message 
        });
    }
});

// ============================================================================
// EXPORTACIÓN
// ============================================================================

export default router;
