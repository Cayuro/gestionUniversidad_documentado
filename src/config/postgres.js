/**
 * ============================================================================
 * ARCHIVO: postgres.js - CONEXIÓN A POSTGRESQL
 * ============================================================================
 * 
 * Este archivo maneja la conexión a PostgreSQL usando el paquete 'pg'.
 * 
 * ¿QUÉ ES POSTGRESQL?
 * - Es una base de datos SQL relacional (la más avanzada de código abierto)
 * - Organiza datos en TABLAS con FILAS y COLUMNAS
 * - Usa SQL (Structured Query Language) para consultas
 * - Garantiza integridad de datos con CONSTRAINTS y FOREIGN KEYS
 * 
 * ¿POR QUÉ USAMOS POSTGRESQL EN ESTE PROYECTO?
 * Para guardar datos estructurados que requieren integridad referencial:
 * - Estudiantes (con email único)
 * - Profesores (vinculados a departamentos)
 * - Cursos (con código único, vinculados a profesores)
 * - Matrículas (vinculan estudiantes con cursos)
 * - Departamentos
 * 
 * ¿QUÉ ES UN POOL DE CONEXIONES?
 * En lugar de abrir y cerrar una conexión cada vez que hacemos una consulta,
 * el Pool mantiene varias conexiones abiertas y las reutiliza.
 * Esto es MUCHO más eficiente y rápido.
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

// Variables de entorno (URL de PostgreSQL)
import { env } from "./env.js";

// 'pg' es el driver oficial de PostgreSQL para Node.js
import pg from 'pg';

// Importamos las funciones del servicio de migración
import { queryData, queryTables } from "../services/migrateService.js";

// ============================================================================
// CONFIGURACIÓN DEL POOL DE CONEXIONES
// ============================================================================

/**
 * Extraemos Pool de pg usando desestructuración.
 * Pool es una clase que maneja múltiples conexiones a la base de datos.
 */
const { Pool } = pg;

/**
 * Creamos el pool con la URL de conexión del archivo .env
 * 
 * La URL tiene este formato:
 * postgresql://usuario:contraseña@host:puerto/nombreBaseDatos
 * 
 * EJEMPLO:
 * postgresql://Juanes:12345@localhost:5434/EstudiantesDB
 * 
 * Exportamos 'pool' para usarlo en otros archivos (services)
 */
export const pool = new Pool({
    connectionString: env.postgresUri
});

// ============================================================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================================================

/**
 * createTables - Crea todas las tablas necesarias en PostgreSQL
 * 
 * Se ejecuta al iniciar el servidor para asegurar que las tablas existen.
 * Si ya existen, no hace nada (gracias a "IF NOT EXISTS" en el SQL).
 */
async function createTables() {
    try {
        // queryTables() está definida en migrateService.js
        // Contiene los CREATE TABLE para todas las tablas
        await queryTables();
        console.log("✅ Tablas de PostgreSQL verificadas/creadas");
    } catch (error) {
        console.error("❌ Error creando tablas:", error);
    }
}

/**
 * migrateData - Migra datos del CSV a las bases de datos
 * 
 * Lee el archivo CSV y:
 * 1. Inserta/actualiza datos en PostgreSQL (estudiantes, profesores, cursos, etc.)
 * 2. Crea documentos en MongoDB (Kardex de estudiantes)
 * 
 * Es idempotente: puedes ejecutarla múltiples veces sin duplicar datos.
 */
async function migrateData() {
    try {
        // queryData() está definida en migrateService.js
        // Retorna contadores de cuántos registros se insertaron
        return await queryData();
    } catch (error) {
        console.error("❌ Error migrando datos:", error);
    }
}

// Exportamos las funciones para usarlas en otros archivos
export { createTables, migrateData };

/**
 * ============================================================================
 * ¿CÓMO USAR EL POOL EN TUS SERVICIOS?
 * ============================================================================
 * 
 * import { pool } from '../config/postgres.js';
 * 
 * async function miConsulta() {
 *     // Obtener una conexión del pool
 *     const client = await pool.connect();
 *     
 *     try {
 *         // Usar transacciones para operaciones múltiples
 *         await client.query('BEGIN');
 *         
 *         const result = await client.query('SELECT * FROM student');
 *         console.log(result.rows);  // Array de objetos
 *         
 *         await client.query('COMMIT');
 *         return result.rows;
 *         
 *     } catch (error) {
 *         // Si hay error, revertir todos los cambios
 *         await client.query('ROLLBACK');
 *         throw error;
 *         
 *     } finally {
 *         // SIEMPRE liberar la conexión al terminar
 *         client.release();
 *     }
 * }
 */