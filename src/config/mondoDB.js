/**
 * ============================================================================
 * ARCHIVO: mongoDB.js - CONEXIÓN A MONGODB
 * ============================================================================
 * 
 * Este archivo maneja la conexión a MongoDB usando Mongoose.
 * 
 * ¿QUÉ ES MONGODB?
 * - Es una base de datos NoSQL (no relacional)
 * - Guarda datos en "documentos" formato JSON (llamados BSON internamente)
 * - No tiene tablas, tiene "colecciones" de documentos
 * - Ideal para datos flexibles o que cambian de estructura
 * 
 * ¿POR QUÉ USAMOS MONGODB EN ESTE PROYECTO?
 * Para guardar los "Kardex" (historiales académicos) de los estudiantes.
 * Los Kardex tienen estructura variable (diferentes cursos, semestres, etc.)
 * y necesitamos consultarlos rápidamente sin hacer JOINs complejos.
 * 
 * ¿QUÉ ES MONGOOSE?
 * Es una librería que facilita trabajar con MongoDB desde Node.js.
 * Nos permite definir "esquemas" (estructuras) para nuestros documentos
 * y proporciona métodos útiles para crear, leer, actualizar y eliminar datos.
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

// Mongoose es el ODM (Object Document Mapper) para MongoDB
// Similar a un ORM pero para bases de datos de documentos
import mongoose from "mongoose";

// Importamos las variables de entorno (incluye la URL de MongoDB)
import { env } from "./env.js";

// ============================================================================
// FUNCIÓN DE CONEXIÓN
// ============================================================================

/**
 * connectMongoDB - Establece la conexión con MongoDB
 * 
 * Es una función asíncrona (async) porque conectarse a una base de datos
 * toma tiempo y no queremos bloquear el programa mientras esperamos.
 * 
 * EJEMPLO DE USO:
 * await connectMongoDB();  // Esperar a que se conecte antes de continuar
 */
export const connectMongoDB = async () => {
    try {
        // mongoose.connect() establece la conexión usando la URL del .env
        // La URL tiene este formato: mongodb://localhost:27018/nombreDB
        await mongoose.connect(env.mongoUri);
        
        console.log("✅ MongoDB conectado exitosamente");
        
    } catch (error) {
        // Si hay error (ej: MongoDB no está corriendo), lo mostramos
        console.log("❌ Error conectando a MongoDB:", error.message);
        
        // process.exit(1) termina la aplicación con código de error
        // Es mejor fallar rápido que continuar sin base de datos
        process.exit(1);
    }
};

/**
 * ============================================================================
 * SOLUCIÓN DE PROBLEMAS COMUNES:
 * ============================================================================
 * 
 * Error: "ECONNREFUSED" o "connection refused"
 * → MongoDB no está corriendo. Ejecuta: docker-compose up -d
 * 
 * Error: "MongooseServerSelectionError"
 * → Revisa que la URL en .env sea correcta (puerto, host)
 * 
 * Error: "Authentication failed"
 * → El usuario/contraseña en la URL están incorrectos
 */