/**
 * ============================================================================
 * ARCHIVO: transcripts.js - MODELO DE MONGODB PARA KARDEX ACADÉMICO
 * ============================================================================
 * 
 * Este archivo define la ESTRUCTURA de los documentos que guardaremos en MongoDB.
 * En MongoDB, un "modelo" define cómo lucen nuestros documentos.
 * 
 * ¿QUÉ ES UN KARDEX ACADÉMICO?
 * Es el historial completo de un estudiante: todos los cursos que ha tomado,
 * sus notas, créditos acumulados y promedio general.
 * 
 * ¿POR QUÉ MONGODB PARA EL KARDEX?
 * - En SQL, obtener el kardex requeriría JOINs de 4-5 tablas (lento)
 * - En MongoDB, todo está en UN documento (muy rápido de consultar)
 * - Cada estudiante = 1 documento con todo su historial embebido
 * 
 * EJEMPLO DE DOCUMENTO RESULTANTE:
 * {
 *   "studentEmail": "j.perez@unigestion.edu",
 *   "studentName": "Juan Perez",
 *   "academicHistory": [
 *     { "courseCode": "CS101", "courseName": "Programación", "grade": 4.5, ... },
 *     { "courseCode": "MAT201", "courseName": "Cálculo", "grade": 3.8, ... }
 *   ],
 *   "summary": { "totalCreditsEarned": 8, "averageGrade": 4.15 }
 * }
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

// Mongoose nos permite definir esquemas y modelos para MongoDB
import mongoose from "mongoose";

// ============================================================================
// ESQUEMA DEL HISTORIAL ACADÉMICO (Sub-documento)
// ============================================================================

/**
 * academicHistorySchema - Define la estructura de CADA CURSO en el historial
 * 
 * Este es un "sub-esquema" que se usa dentro del esquema principal.
 * Cada elemento del array academicHistory tendrá esta estructura.
 * 
 * { _id: false } evita que MongoDB genere un ID para cada curso del historial.
 * No lo necesitamos porque el curso se identifica por courseCode + semester.
 */
const academicHistorySchema = mongoose.Schema(
    {
        // Código único del curso (ej: "CS101", "MAT201")
        "courseCode": String,
        
        // Nombre completo del curso
        "courseName": String,
        
        // Número de créditos del curso
        "credits": Number,
        
        // Semestre en que se cursó (ej: "2023-1", "2024-2")
        "semester": String,
        
        // Nombre del profesor que dictó el curso
        "professorName": String,
        
        // Nota obtenida (escala 0-5)
        "grade": Number,
        
        // Estado: "Aprobado", "Reprobado", "En curso", etc.
        "status": String
    }, 
    { _id: false }  // No generar _id para los cursos individuales
);

// ============================================================================
// ESQUEMA PRINCIPAL DEL KARDEX (Documento completo)
// ============================================================================

/**
 * academicTranscriptsSchema - Define la estructura del KARDEX COMPLETO
 * 
 * Este es el documento principal que representa todo el historial de un estudiante.
 * Nota: { _id: false } está aquí pero MongoDB igual genera _id para documentos principales.
 */
const academicTranscriptsSchema = mongoose.Schema(
    {
        // Email del estudiante (usado como identificador único)
        "studentEmail": String,
        
        // Nombre completo del estudiante
        "studentName": String,
        
        // Array de cursos - cada elemento sigue el academicHistorySchema
        // Esto es lo que hace MongoDB poderoso: arrays embebidos
        "academicHistory": [academicHistorySchema],
        
        // Resumen calculado del historial
        "summary": {
            // Total de créditos aprobados
            "totalCreditsEarned": Number,
            
            // Promedio de todas las notas
            "averageGrade": Number
        }
    }, 
    { _id: false }
);

// ============================================================================
// CREACIÓN Y EXPORTACIÓN DEL MODELO
// ============================================================================

/**
 * mongoose.model() crea un "Modelo" a partir del esquema.
 * 
 * Parámetros:
 * 1. "academicTranscripts" - nombre de la colección en MongoDB (se pluraliza automáticamente)
 * 2. academicTranscriptsSchema - el esquema que define la estructura
 * 
 * El modelo nos da métodos para interactuar con la base de datos:
 * - AcademicTranscripts.find() - buscar documentos
 * - AcademicTranscripts.findOne() - buscar un documento
 * - AcademicTranscripts.findOneAndUpdate() - buscar y actualizar
 * - AcademicTranscripts.create() - crear nuevo documento
 * - AcademicTranscripts.deleteOne() - eliminar documento
 */
export const AcademicTranscripts = mongoose.model(
    "academicTranscripts",
    academicTranscriptsSchema
);

/**
 * ============================================================================
 * ¿CÓMO CREAR UN NUEVO MODELO?
 * ============================================================================
 * 
 * Ejemplo: Si quisieras guardar "notificaciones" de estudiantes en MongoDB:
 * 
 * 1. Crea el archivo: src/models/notifications.js
 * 
 * 2. Define el esquema:
 *    const notificationSchema = mongoose.Schema({
 *        studentEmail: String,
 *        title: String,
 *        message: String,
 *        read: { type: Boolean, default: false },
 *        createdAt: { type: Date, default: Date.now }
 *    });
 * 
 * 3. Exporta el modelo:
 *    export const Notification = mongoose.model("notifications", notificationSchema);
 * 
 * 4. Úsalo en tus servicios:
 *    import { Notification } from '../models/notifications.js';
 *    await Notification.create({ studentEmail: "...", title: "..." });
 */