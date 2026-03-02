/**
 * ============================================================================
 * ARCHIVO: coursesServices.js - LÓGICA DE NEGOCIO PARA CURSOS
 * ============================================================================
 * 
 * Este archivo contiene las funciones que interactúan con PostgreSQL
 * para gestionar los cursos.
 * 
 * ¿QUÉ ES UN SERVICIO?
 * Es donde vive la "lógica de negocio" - las operaciones reales con la base de datos.
 * Las rutas llaman a estos servicios para obtener o modificar datos.
 * 
 * SEPARACIÓN DE RESPONSABILIDADES:
 * - Rutas: Reciben peticiones HTTP y envían respuestas
 * - Servicios: Hacen el trabajo real con la base de datos
 * 
 * PATRÓN USADO: Transacciones SQL
 * Cada función usa BEGIN/COMMIT/ROLLBACK para asegurar integridad de datos.
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

// Importamos el pool de conexiones de PostgreSQL
import { pool } from "../config/postgres.js";

// ============================================================================
// FUNCIÓN: getCourses - OBTENER TODOS LOS CURSOS
// ============================================================================

/**
 * getCourses - Obtiene todos los cursos con información del profesor
 * 
 * Esta función:
 * 1. Obtiene una conexión del pool
 * 2. Ejecuta una consulta SQL con JOIN
 * 3. Retorna los resultados
 * 
 * @returns {Array} Lista de cursos con código, nombre, créditos y profesor
 */
async function getCourses() {
    // Obtenemos una conexión del pool
    // ¡IMPORTANTE! Siempre debemos liberarla al final con client.release()
    const client = await pool.connect();
    
    try {
        // Iniciamos una transacción
        // BEGIN indica que las siguientes operaciones son parte de una unidad
        await client.query('BEGIN');
        
        /**
         * CONSULTA SQL EXPLICADA:
         * 
         * SELECT c.code, c.name, c.credits, p.name as profesor_name
         * FROM course c
         * JOIN profesor p ON c.profesor_id = p.id
         * 
         * - SELECT: qué columnas queremos
         * - FROM course c: de la tabla course (alias "c" para abreviar)
         * - JOIN profesor p: unimos con tabla profesor (alias "p")
         * - ON c.profesor_id = p.id: la condición de unión
         * 
         * Resultado: cada curso con el nombre de su profesor
         */
        const result = await client.query(`
            SELECT c.code, c.name, c.credits, p."name" as profesor_name 
            FROM "course" c 
            JOIN profesor p ON c.profesor_id = p.id;
        `);
        
        // COMMIT confirma todos los cambios de la transacción
        // (En este caso solo leemos, pero es buena práctica)
        await client.query('COMMIT');
        
        // result.rows es un array de objetos con los datos
        return result.rows;
        
    } catch (error) {
        // Si hay error, ROLLBACK deshace todos los cambios
        await client.query('ROLLBACK');
        throw error;  // Re-lanzamos el error para que la ruta lo maneje
        
    } finally {
        // FINALLY se ejecuta SIEMPRE, haya error o no
        // Liberamos la conexión para que otros la puedan usar
        client.release();
    }
}

// ============================================================================
// FUNCIÓN: getCoursesByCode - OBTENER UN CURSO POR CÓDIGO
// ============================================================================

/**
 * getCoursesByCode - Busca un curso específico por su código
 * 
 * @param {string} code - El código del curso (ej: "CS101")
 * @returns {Object|undefined} El curso encontrado o undefined si no existe
 */
async function getCoursesByCode(code) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        /**
         * CONSULTA CON PARÁMETROS:
         * 
         * $1 es un "placeholder" que se reemplaza por el valor en el array [code]
         * Esto previene SQL Injection (un ataque de seguridad muy común)
         * 
         * ❌ MALO (vulnerable):
         * `SELECT * FROM course WHERE code = '${code}'`
         * 
         * ✅ BUENO (seguro):
         * client.query('SELECT * FROM course WHERE code = $1', [code])
         */
        const result = await client.query(`
            SELECT c.code, c.name, c.credits, p."name" as profesor_name 
            FROM "course" c 
            JOIN profesor p ON c.profesor_id = p.id 
            WHERE c.code = $1;
        `, [code]);
        
        await client.query('COMMIT');
        
        // result.rows[0] es el primer (y único) resultado
        // Si no hay resultados, será undefined
        return result.rows[0];
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// ============================================================================
// FUNCIÓN: updateCourseByCode - ACTUALIZAR UN CURSO
// ============================================================================

/**
 * updateCourseByCode - Actualiza parcialmente un curso
 * 
 * @param {Object} data - Campos a actualizar { name?, credits?, profesor_id? }
 * @param {string} code - Código del curso a actualizar
 * @returns {Object} El curso actualizado
 * 
 * COALESCE(valor_nuevo, valor_actual):
 * - Si valor_nuevo es NULL → usa valor_actual (no cambia)
 * - Si valor_nuevo tiene dato → usa valor_nuevo (actualiza)
 * 
 * Esto permite actualizar solo los campos que se envían.
 */
async function updateCourseByCode(data, code) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        /**
         * UPDATE con COALESCE:
         * 
         * UPDATE course SET 
         *     name = COALESCE($1, name),      -- Si $1 es null, mantiene name actual
         *     credits = COALESCE($2, credits) -- Si $2 es null, mantiene credits actual
         * WHERE code = $4
         * 
         * Ejemplo: Si solo envías { name: "Nuevo nombre" }
         * - $1 = "Nuevo nombre" → se actualiza
         * - $2 = undefined/null → COALESCE usa el valor actual
         * - $3 = undefined/null → COALESCE usa el valor actual
         */
        const result = await client.query(`
            UPDATE course c 
            SET name = COALESCE($1, name), 
                credits = COALESCE($2, credits), 
                profesor_id = COALESCE($3, profesor_id) 
            WHERE c.code = $4
        `, [data.name, data.credits, data.profesor_id, code]);
        
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
// EXPORTACIÓN
// ============================================================================

// Exportamos las funciones para usarlas en las rutas
export { getCourses, getCoursesByCode, updateCourseByCode };

/**
 * ============================================================================
 * ¿CÓMO AGREGAR UNA NUEVA FUNCIÓN?
 * ============================================================================
 * 
 * Ejemplo: Crear un curso nuevo
 * 
 * async function createCourse(data) {
 *     const client = await pool.connect();
 *     
 *     try {
 *         await client.query('BEGIN');
 *         
 *         const result = await client.query(`
 *             INSERT INTO course (code, name, credits, profesor_id)
 *             VALUES ($1, $2, $3, $4)
 *             RETURNING *
 *         `, [data.code, data.name, data.credits, data.profesor_id]);
 *         
 *         await client.query('COMMIT');
 *         return result.rows[0];
 *         
 *     } catch (error) {
 *         await client.query('ROLLBACK');
 *         throw error;
 *     } finally {
 *         client.release();
 *     }
 * }
 * 
 * No olvides agregarlo al export:
 * export { getCourses, getCoursesByCode, updateCourseByCode, createCourse };
 */