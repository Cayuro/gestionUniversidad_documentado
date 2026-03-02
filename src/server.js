/**
 * ============================================================================
 * ARCHIVO: server.js - PUNTO DE ENTRADA DE LA APLICACIÓN
 * ============================================================================
 * 
 * Este es el archivo principal que arranca todo el servidor.
 * Piensa en él como el "interruptor de encendido" de tu aplicación.
 * 
 * ¿QUÉ HACE ESTE ARCHIVO?
 * 1. Conecta a las bases de datos (MongoDB y PostgreSQL)
 * 2. Crea las tablas necesarias en PostgreSQL
 * 3. Inicia el servidor web para recibir peticiones HTTP
 * 
 * FLUJO DE EJECUCIÓN:
 * npm run dev → Node.js ejecuta este archivo → Se conectan las BDs → El servidor escucha peticiones
 */

// ============================================================================
// IMPORTACIONES - Traemos las piezas que necesitamos de otros archivos
// ============================================================================

// 'app' es nuestra aplicación Express con todas las rutas configuradas
import { app } from "./app.js";

// 'env' contiene las variables de entorno (puerto, URLs de bases de datos, etc.)
import { env } from "./config/env.js";

// Función para conectar a MongoDB (base de datos NoSQL para el Kardex)
import { connectMongoDB } from "./config/mondoDB.js";

// Función para crear las tablas en PostgreSQL (base de datos SQL relacional)
import { createTables } from "./config/postgres.js";

// ============================================================================
// INICIO DEL SERVIDOR - Aquí arranca todo
// ============================================================================

/**
 * Usamos try/catch para manejar errores.
 * Si algo falla (ej: la base de datos no está disponible), el catch captura el error
 * y el programa termina de forma controlada en lugar de "crashear" sin explicación.
 */
try {
    // PASO 1: Conectar a MongoDB
    // MongoDB guardará los "Kardex" (historiales académicos) de los estudiantes
    // Es una base de datos NoSQL, ideal para documentos con estructura flexible
    console.log('Conectando a MongoDB...');
    await connectMongoDB();
    
    // PASO 2: Conectar a PostgreSQL y crear tablas
    // PostgreSQL es una base de datos SQL relacional, perfecta para datos estructurados
    // como estudiantes, profesores, cursos y matrículas con relaciones entre ellos
    console.log('Conectando a PostgreSQL...');
    await createTables();
    
    // PASO 3: Iniciar el servidor HTTP
    // app.listen() hace que Express "escuche" peticiones en el puerto especificado
    // Cuando alguien hace una petición a http://localhost:3000/..., Express la recibe
    app.listen(env.port, () => {
        console.log(`✅ Servidor corriendo en http://localhost:${env.port}`);
        console.log(`📋 Endpoints disponibles:`);
        console.log(`   POST /api/simulacro/migrate  - Migrar datos del CSV a las bases de datos`);
        console.log(`   GET  /api/courses            - Obtener todos los cursos`);
        console.log(`   GET  /api/courses/:code      - Obtener un curso por su código`);
        console.log(`   PATCH /api/courses/:code     - Actualizar un curso`);
        console.log(`   GET  /api/reports/report     - Obtener reporte financiero por facultad`);
    });

} catch (error) {
    // Si algo salió mal, mostramos el error y terminamos el programa
    // process.exit(1) indica que el programa terminó con error (código 1)
    // process.exit(0) indicaría que terminó correctamente (código 0)
    console.log('❌ Error al iniciar el servidor:', error);
    process.exit(1);
}
