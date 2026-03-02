/**
 * ============================================================================
 * ARCHIVO: studentsService.js - LÓGICA DE NEGOCIO PARA ESTUDIANTES
 * ============================================================================
 * 
 * Este archivo contiene las funciones para consultar información de estudiantes.
 * Principalmente interactúa con MongoDB para obtener el Kardex (historial académico).
 * 
 * ¿POR QUÉ MONGODB PARA EL KARDEX?
 * - En PostgreSQL, obtener el kardex requiere JOINs de múltiples tablas (lento)
 * - En MongoDB, todo el historial está en UN documento (muy rápido)
 * - El README pide que responda en menos de 100ms
 * 
 * ENDPOINTS QUE USA ESTE SERVICIO:
 * GET /api/students/:email/transcript → getTranscriptByEmail()
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

// Importamos el modelo de MongoDB para los Kardex académicos
import { AcademicTranscripts } from "../models/transcripts.js";

// Importamos el pool de PostgreSQL para consultas adicionales si se necesitan
import { pool } from "../config/postgres.js";

// ============================================================================
// FUNCIÓN: getTranscriptByEmail - OBTENER KARDEX POR EMAIL
// ============================================================================

/**
 * getTranscriptByEmail - Busca el historial académico completo de un estudiante
 * 
 * Esta función consulta MongoDB directamente, lo que es mucho más rápido
 * que hacer JOINs en PostgreSQL para obtener la misma información.
 * 
 * @param {string} email - Email del estudiante (ej: "j.perez@unigestion.edu")
 * @returns {Object|null} El documento del Kardex o null si no existe
 * 
 * EJEMPLO DE RETORNO:
 * {
 *   "studentEmail": "j.perez@unigestion.edu",
 *   "studentName": "Juan Perez",
 *   "academicHistory": [
 *     { "courseCode": "CS101", "courseName": "Programación", "grade": 4.5, ... },
 *     { "courseCode": "MAT201", "courseName": "Cálculo", "grade": 3.8, ... }
 *   ],
 *   "summary": {
 *     "totalCreditsEarned": 8,
 *     "averageGrade": 4.15
 *   }
 * }
 */
async function getTranscriptByEmail(email) {
    // Normalizamos el email a minúsculas para búsqueda consistente
    const normalizedEmail = email.trim().toLowerCase();
    
    // findOne busca UN documento que coincida con el filtro
    // Si no encuentra nada, retorna null
    const transcript = await AcademicTranscripts.findOne({ 
        studentEmail: normalizedEmail 
    });
    
    return transcript;
}

// ============================================================================
// FUNCIÓN: getAllStudents - OBTENER LISTA DE TODOS LOS ESTUDIANTES
// ============================================================================

/**
 * getAllStudents - Obtiene todos los estudiantes de PostgreSQL
 * 
 * Esta función consulta la tabla student para obtener datos básicos.
 * Útil para listar estudiantes o buscar por otros criterios.
 * 
 * @returns {Array} Lista de estudiantes { id, name, email, phone }
 */
async function getAllStudents() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const result = await client.query(`
            SELECT id, name, email, phone 
            FROM student 
            ORDER BY name;
        `);
        
        await client.query('COMMIT');
        return result.rows;
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// ============================================================================
// FUNCIÓN: getStudentByEmail - OBTENER UN ESTUDIANTE POR EMAIL (SQL)
// ============================================================================

/**
 * getStudentByEmail - Busca un estudiante en PostgreSQL por su email
 * 
 * A diferencia de getTranscriptByEmail que trae el Kardex completo de MongoDB,
 * esta función solo trae los datos básicos del estudiante desde PostgreSQL.
 * 
 * @param {string} email - Email del estudiante
 * @returns {Object|undefined} Datos del estudiante o undefined si no existe
 */
async function getStudentByEmail(email) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const normalizedEmail = email.trim().toLowerCase();
        
        const result = await client.query(`
            SELECT id, name, email, phone 
            FROM student 
            WHERE email = $1;
        `, [normalizedEmail]);
        
        await client.query('COMMIT');
        return result.rows[0];
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// ============================================================================
// FUNCIÓN: getStudentEnrollments - OBTENER INSCRIPCIONES DE UN ESTUDIANTE
// ============================================================================

/**
 * getStudentEnrollments - Obtiene todas las inscripciones de un estudiante desde SQL
 * 
 * Esta es la alternativa "lenta" a consultar el Kardex de MongoDB.
 * Requiere JOINs entre varias tablas, pero los datos están 100% actualizados.
 * 
 * @param {string} email - Email del estudiante
 * @returns {Array} Lista de inscripciones con detalles del curso
 */
async function getStudentEnrollments(email) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const normalizedEmail = email.trim().toLowerCase();
        
        /**
         * Esta consulta une 4 tablas:
         * student → enrollments → course → profesor
         * 
         * Es exactamente lo que evitamos con MongoDB, pero útil
         * si necesitas datos 100% actualizados (no cacheados en MongoDB)
         */
        const result = await client.query(`
            SELECT 
                c.code as course_code,
                c.name as course_name,
                c.credits,
                e.semester,
                e.grade,
                e.tuition_fee,
                p.name as professor_name
            FROM student s
            JOIN enrrollments e ON s.id = e.student_id
            JOIN course c ON e.course_code = c.code
            JOIN profesor p ON c.profesor_id = p.id
            WHERE s.email = $1
            ORDER BY e.semester DESC, c.name;
        `, [normalizedEmail]);
        
        await client.query('COMMIT');
        return result.rows;
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

export { 
    getTranscriptByEmail,    // Para el endpoint GET /api/students/:email/transcript
    getAllStudents,          // Para listar todos los estudiantes
    getStudentByEmail,       // Para buscar un estudiante específico
    getStudentEnrollments    // Para ver inscripciones desde SQL
};

/**
 * ============================================================================
 * ¿CÓMO USAR ESTAS FUNCIONES EN LAS RUTAS?
 * ============================================================================
 * 
 * import { getTranscriptByEmail } from '../services/studentsService.js';
 * 
 * router.get('/:email/transcript', async (req, res) => {
 *     const { email } = req.params;
 *     const transcript = await getTranscriptByEmail(email);
 *     
 *     if (!transcript) {
 *         return res.status(404).json({ message: 'Estudiante no encontrado' });
 *     }
 *     
 *     res.json(transcript);
 * });
 */
