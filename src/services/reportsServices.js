/**
 * ============================================================================
 * ARCHIVO: reportsServices.js - LÓGICA PARA REPORTES FINANCIEROS
 * ============================================================================
 * 
 * Este archivo genera reportes financieros consultando PostgreSQL.
 * 
 * REPORTE PRINCIPAL:
 * Ingresos por matrícula agrupados por facultad/departamento
 * 
 * ¿CÓMO FUNCIONA?
 * Sumamos el tuition_fee (costo de matrícula) de todas las inscripciones,
 * agrupado por el departamento al que pertenece el profesor del curso.
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

import { pool } from "../config/postgres.js";

// ============================================================================
// FUNCIÓN: getReport - REPORTE DE INGRESOS POR FACULTAD
// ============================================================================

/**
 * getReport - Calcula el total recaudado por cada facultad/departamento
 * 
 * LÓGICA DEL REPORTE:
 * 1. Cada inscripción (enrollment) tiene un tuition_fee (costo)
 * 2. Cada inscripción está vinculada a un curso
 * 3. Cada curso tiene un profesor
 * 4. Cada profesor pertenece a un departamento
 * 
 * Sumamos todos los tuition_fee y los agrupamos por departamento.
 * 
 * @returns {Array} Lista de objetos { facultad: string, totalrecaudo: number }
 * 
 * EJEMPLO DE RESULTADO:
 * [
 *   { facultad: "Ingeniería", totalrecaudo: "4800000" },
 *   { facultad: "Humanidades", totalrecaudo: "2400000" }
 * ]
 */
async function getReport() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        /**
         * CONSULTA SQL CON MÚLTIPLES JOINs:
         * 
         * Esta consulta une 4 tablas para obtener el reporte:
         * 
         * enrollments ──┬──→ course ──→ profesor ──→ department
         *               │
         *            (tiene tuition_fee)
         * 
         * PASO A PASO:
         * 
         * 1. SELECT d.name as facultad, SUM(e.tuition_fee) as totalRecaudo
         *    → Seleccionamos nombre del departamento y suma de matrículas
         * 
         * 2. FROM enrrollments e
         *    → Empezamos desde la tabla de inscripciones
         * 
         * 3. JOIN course c ON c.code = e.course_code
         *    → Unimos con cursos para saber qué curso es cada inscripción
         * 
         * 4. JOIN profesor p ON p.id = c.profesor_id
         *    → Unimos con profesores para saber quién dicta el curso
         * 
         * 5. JOIN department d ON d.id = p.department_id
         *    → Unimos con departamentos para saber a qué facultad pertenece
         * 
         * 6. GROUP BY d.name
         *    → Agrupamos por nombre de departamento (para sumar por cada uno)
         * 
         * DIAGRAMA DE RELACIONES:
         * 
         * enrrollments     course        profesor       department
         * ┌──────────┐    ┌──────┐      ┌─────────┐    ┌────────────┐
         * │course_code├───►│code  │      │id       │◄───┤id          │
         * │tuition_fee│    │name  │      │name     │    │name        │
         * └──────────┘    │profesor_id├─►│dept_id  ├───►└────────────┘
         *                 └──────┘      └─────────┘
         */
        const result = await client.query(`
            SELECT d.name as facultad, SUM(e.tuition_fee) as totalRecaudo 
            FROM enrrollments e
            JOIN course c ON c.code = e.course_code
            JOIN profesor p ON p.id = c.profesor_id
            JOIN department d ON d.id = p.department_id
            GROUP BY d.name;
        `);

        // Log para depuración (ver resultados en consola del servidor)
        console.log('📊 Reporte generado:', result.rows);
        
        await client.query('COMMIT');
        return result.rows;
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Exportamos la función
export { getReport };

/**
 * ============================================================================
 * CONCEPTOS SQL IMPORTANTES:
 * ============================================================================
 * 
 * 1. JOIN - Une dos tablas basándose en una condición
 *    JOIN tabla ON tabla1.columna = tabla2.columna
 * 
 * 2. GROUP BY - Agrupa filas que tienen el mismo valor
 *    Necesario cuando usas funciones de agregación (SUM, COUNT, AVG)
 * 
 * 3. SUM() - Suma todos los valores de una columna
 * 
 * 4. Funciones de agregación comunes:
 *    - SUM(columna)   → Suma total
 *    - COUNT(*)       → Contar filas
 *    - AVG(columna)   → Promedio
 *    - MAX(columna)   → Valor máximo
 *    - MIN(columna)   → Valor mínimo
 * 
 * ============================================================================
 * EJERCICIO: ¿CÓMO AÑADIRÍAS OTRO REPORTE?
 * ============================================================================
 * 
 * Ejemplo: Reporte de promedio de notas por departamento
 * 
 * async function getGradesByDepartment() {
 *     const client = await pool.connect();
 *     try {
 *         await client.query('BEGIN');
 *         const result = await client.query(`
 *             SELECT d.name as facultad, 
 *                    ROUND(AVG(e.grade), 2) as promedio_notas,
 *                    COUNT(*) as total_inscripciones
 *             FROM enrrollments e
 *             JOIN course c ON c.code = e.course_code
 *             JOIN profesor p ON p.id = c.profesor_id
 *             JOIN department d ON d.id = p.department_id
 *             GROUP BY d.name
 *             ORDER BY promedio_notas DESC;
 *         `);
 *         await client.query('COMMIT');
 *         return result.rows;
 *     } catch (error) {
 *         await client.query('ROLLBACK');
 *         throw error;
 *     } finally {
 *         client.release();
 *     }
 * }
 */