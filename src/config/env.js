/**
 * ============================================================================
 * ARCHIVO: env.js - CONFIGURACIÓN DE VARIABLES DE ENTORNO
 * ============================================================================
 * 
 * Este archivo carga y exporta las variables de entorno de la aplicación.
 * 
 * ¿QUÉ SON LAS VARIABLES DE ENTORNO?
 * Son valores de configuración que se guardan FUERA del código, en un archivo .env
 * Esto es importante porque:
 * - Puedes tener diferentes configuraciones para desarrollo y producción
 * - No expones contraseñas ni datos sensibles en el código fuente
 * - Puedes cambiar configuraciones sin modificar el código
 * 
 * EJEMPLO DE ARCHIVO .env:
 * PORT=3000
 * POSTGRES_URI="postgresql://usuario:contraseña@localhost:5434/miBaseDatos"
 * MONGO_URI="mongodb://localhost:27018/miBaseDatos"
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

// 'dotenv' es una librería que lee el archivo .env y carga sus valores
import { config } from 'dotenv';

// Estas utilidades nos ayudan a encontrar la ruta correcta del archivo .env
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ============================================================================
// CARGA DEL ARCHIVO .env
// ============================================================================

/**
 * En ES Modules (import/export), no existe __dirname por defecto.
 * Estas líneas recrean esa funcionalidad para saber dónde estamos.
 * 
 * import.meta.url = ruta completa de este archivo
 * fileURLToPath() = convierte la URL a una ruta normal de archivo
 * dirname() = obtiene solo la carpeta, sin el nombre del archivo
 */
const _dirname = dirname(fileURLToPath(import.meta.url));

/**
 * config() carga el archivo .env
 * resolve(_dirname, '../../.env') construye la ruta: desde /src/config/ sube 2 niveles hasta la raíz
 * 
 * ESTRUCTURA:
 * proyecto/
 *   .env          ← Aquí está el archivo que buscamos
 *   src/
 *     config/
 *       env.js    ← Aquí estamos (subimos 2 niveles con ../../)
 */
config({ path: resolve(_dirname, '../../.env') });

// ============================================================================
// VALIDACIÓN DE VARIABLES REQUERIDAS
// ============================================================================

/**
 * Lista de variables que DEBEN existir para que la app funcione.
 * Si falta alguna, mostramos un error.
 */
const required = ["MONGO_URI", "POSTGRES_URI"];

for (const key of required) {
    if (!process.env[key]) {
        console.log(`❌ Error: Falta la variable de entorno requerida: ${key}`);
        console.log(`   Asegúrate de crear un archivo .env en la raíz del proyecto`);
        // Podrías descomentar esto para detener la app si falta una variable:
        // throw new Error(`Missing required environment variable: ${key}`);
    }
}

// ============================================================================
// EXPORTACIÓN DE VARIABLES DE ENTORNO
// ============================================================================

/**
 * Exportamos un objeto 'env' con todas las configuraciones.
 * El operador ?? significa "si es null o undefined, usa el valor de la derecha"
 * 
 * EJEMPLO DE USO EN OTROS ARCHIVOS:
 * import { env } from './config/env.js';
 * console.log(env.port);  // 3000
 */
export const env = {
    // Puerto donde correrá el servidor (por defecto 3000)
    port: process.env.PORT ?? 3000,
    
    // URL de conexión a PostgreSQL
    // Formato: postgresql://usuario:contraseña@host:puerto/nombreDB
    postgresUri: process.env.POSTGRES_URI,
    
    // URL de conexión a MongoDB
    // Formato: mongodb://host:puerto/nombreDB
    mongoUri: process.env.MONGO_URI,
    
    // Ruta al archivo CSV con los datos a migrar
    fileDataCsv: process.env.FILE_DATA_CSV ?? "./data/simulacro_unigestion_data2.csv"
};
