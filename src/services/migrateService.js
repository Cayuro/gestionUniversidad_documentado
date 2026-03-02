/**
 * ============================================================================
 * ARCHIVO: migrateService.js - SERVICIO DE MIGRACIÓN DE DATOS (ETL)
 * ============================================================================
 * 
 * Este es el archivo más importante del proyecto. Realiza el proceso ETL:
 * - E (Extract): Lee datos del archivo CSV
 * - T (Transform): Limpia y normaliza los datos
 * - L (Load): Carga los datos en PostgreSQL y MongoDB
 * 
 * ¿QUÉ HACE ESTE SERVICIO?
 * 1. Crea las tablas en PostgreSQL (si no existen)
 * 2. Lee el archivo CSV con datos "sucios"
 * 3. Limpia cada registro (normaliza nombres, emails, etc.)
 * 4. Inserta datos en PostgreSQL (estudiantes, profesores, cursos, matrículas)
 * 5. Crea/actualiza documentos en MongoDB (Kardex de estudiantes)
 * 
 * IDEMPOTENCIA:
 * Puedes ejecutar este servicio múltiples veces sin duplicar datos.
 * Usa "ON CONFLICT" en SQL para actualizar si ya existe.
 */

// ============================================================================
// IMPORTACIONES
// ============================================================================

// Pool de conexiones a PostgreSQL
import { pool } from "../config/postgres.js";

// 'fs' (File System) - para leer archivos del disco
import fs from 'fs';

// 'csv-parser' - para procesar archivos CSV línea por línea
import csv from 'csv-parser';

// Variables de entorno (incluye la ruta al archivo CSV)
import { env } from "../config/env.js";

// Modelo de MongoDB para los Kardex académicos
import { AcademicTranscripts } from "../models/transcripts.js";

// ============================================================================
// FUNCIÓN: queryTables - CREAR TABLAS EN POSTGRESQL
// ============================================================================

/**
 * queryTables - Crea todas las tablas necesarias en PostgreSQL
 * 
 * Esta función se ejecuta al iniciar el servidor.
 * "IF NOT EXISTS" asegura que no falle si las tablas ya existen.
 * 
 * ORDEN DE CREACIÓN IMPORTANTE:
 * Las tablas se crean en orden específico porque hay FOREIGN KEYS:
 * 1. student (no depende de nadie)
 * 2. department (no depende de nadie)
 * 3. profesor (depende de department)
 * 4. course (depende de profesor)
 * 5. enrollments (depende de student y course)
 */
export async function queryTables() {
    const client = await pool.connect();
    
    try {
        // Iniciamos transacción - si algo falla, se revierte todo
        await client.query('BEGIN');

        // ================================================================
        // TABLA: student - Información de estudiantes
        // ================================================================
        /**
         * Campos:
         * - id: Identificador único (SERIAL = autoincrementa)
         * - name: Nombre completo
         * - email: Correo electrónico (UNIQUE = no se puede repetir)
         * - phone: Teléfono
         */
        await client.query(`
            CREATE TABLE IF NOT EXISTS "student" (
                "id"    SERIAL NOT NULL UNIQUE,
                "name"  VARCHAR(50) NOT NULL,
                "email" VARCHAR(50) NOT NULL UNIQUE,
                "phone" VARCHAR(15) NOT NULL,
                PRIMARY KEY("id")
            );
        `);

        // ================================================================
        // TABLA: department - Facultades/Departamentos
        // ================================================================
        /**
         * Tabla simple para normalizar departamentos.
         * En lugar de repetir "Ingeniería" en cada profesor,
         * guardamos el ID que referencia a esta tabla.
         */
        await client.query(`
            CREATE TABLE IF NOT EXISTS "department" (
                "id"   SERIAL NOT NULL UNIQUE,
                "name" VARCHAR(50) NOT NULL UNIQUE,
                PRIMARY KEY("id")
            );
        `);

        // ================================================================
        // TABLA: profesor - Información de profesores
        // ================================================================
        /**
         * FOREIGN KEY (department_id):
         * Vincula cada profesor con su departamento.
         * Garantiza que no puedas asignar un departamento que no existe.
         */
        await client.query(`
            CREATE TABLE IF NOT EXISTS "profesor" (
                "id"            SMALLSERIAL NOT NULL UNIQUE,
                "name"          VARCHAR(50) NOT NULL,
                "email"         VARCHAR(50) NOT NULL UNIQUE,
                "department_id" INTEGER,
                PRIMARY KEY("id"),
                CONSTRAINT fk_department_id_department 
                    FOREIGN KEY ("department_id")
                    REFERENCES "department"("id")
                    ON UPDATE NO ACTION ON DELETE NO ACTION
            );
        `);

        // ================================================================
        // TABLA: course - Cursos/Materias
        // ================================================================
        /**
         * - code: Código único del curso (ej: CS101) - es la PRIMARY KEY
         * - profesor_id: Quién dicta el curso (FOREIGN KEY)
         */
        await client.query(`
            CREATE TABLE IF NOT EXISTS "course" (
                "code"       VARCHAR(20) NOT NULL UNIQUE,
                "name"       VARCHAR(50) NOT NULL UNIQUE,
                "credits"    SMALLINT NOT NULL,
                "profesor_id" INTEGER,
                PRIMARY KEY("code"),
                CONSTRAINT fk_profesor_id_profesor 
                    FOREIGN KEY ("profesor_id")
                    REFERENCES "profesor"("id")
                    ON UPDATE NO ACTION ON DELETE NO ACTION
            );
        `);

        // ================================================================
        // TABLA: enrollments - Inscripciones/Matrículas
        // ================================================================
        /**
         * Esta tabla relaciona estudiantes con cursos.
         * Es la tabla más importante para el negocio.
         * 
         * FOREIGN KEYS:
         * - student_id → student.id
         * - course_code → course.code
         * 
         * Esto garantiza:
         * - No puedes inscribir a un estudiante que no existe
         * - No puedes inscribir en un curso que no existe
         */
        await client.query(`
            CREATE TABLE IF NOT EXISTS "enrrollments" (
                "enrolmment_id" VARCHAR(20) NOT NULL UNIQUE,
                "semester"      VARCHAR(15) NOT NULL,
                "grade"         DECIMAL(2,1) NOT NULL,
                "tuition_fee"   INTEGER NOT NULL,
                "student_id"    INTEGER NOT NULL,
                "course_code"   VARCHAR(20) NOT NULL,
                PRIMARY KEY("enrolmment_id"),
                CONSTRAINT fk_student_id_student 
                    FOREIGN KEY("student_id") 
                    REFERENCES "student"("id")
                    ON UPDATE NO ACTION ON DELETE NO ACTION,
                CONSTRAINT fk_course_code_course 
                    FOREIGN KEY("course_code") 
                    REFERENCES "course"("code")
                    ON UPDATE NO ACTION ON DELETE NO ACTION
            );
        `);
        
        // Si todo salió bien, confirmamos los cambios
        await client.query('COMMIT');
        
    } catch (error) {
        // Si algo falló, revertimos todos los cambios
        await client.query('ROLLBACK');
        throw error;
    } finally {
        // Siempre liberamos la conexión
        client.release();
    }
}

// ============================================================================
// FUNCIÓN: queryData - MIGRAR DATOS DEL CSV A LAS BASES DE DATOS
// ============================================================================

/**
 * queryData - Lee el CSV y carga datos en PostgreSQL y MongoDB
 * 
 * PROCESO:
 * 1. Lee el archivo CSV completo
 * 2. Por cada fila:
 *    a. Limpia los datos (trim, lowercase, etc.)
 *    b. Inserta/actualiza en PostgreSQL
 *    c. Actualiza el Kardex en MongoDB
 * 3. Calcula y actualiza los resúmenes de cada estudiante
 * 
 * @returns {Object} Contadores de registros insertados
 */
export async function queryData() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // ================================================================
        // PASO 1: LEER EL ARCHIVO CSV
        // ================================================================
        /**
         * Usamos Promises para manejar la lectura asíncrona del archivo.
         * csv-parser lee el archivo línea por línea y convierte cada línea
         * en un objeto JavaScript.
         * 
         * EJEMPLO: Si el CSV tiene:
         * student_name,student_email
         * Juan Perez,j.perez@mail.com
         * 
         * El resultado será:
         * [{ student_name: "Juan Perez", student_email: "j.perez@mail.com" }]
         */
        const result = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(env.fileDataCsv)     // Abre el archivo
                .pipe(csv())                          // Procesa como CSV
                .on("data", (data) => result.push(data))  // Cada fila → array
                .on("end", resolve)                   // Terminó → resolve
                .on("error", reject);                 // Error → reject
        });
        
        // Contadores para las estadísticas de migración
        const counters = {
            contStudents: 0,
            contCourses: 0,
            contEnrollments: 0,
            contProfessors: 0,
            contDepartments: 0
        };
        
        // ================================================================
        // PASO 2: PROCESAR CADA FILA DEL CSV
        // ================================================================
        for (const row of result) {
            
            // ------------------------------------------------------------
            // 2.1: LIMPIAR Y NORMALIZAR LOS DATOS
            // ------------------------------------------------------------
            /**
             * Los datos del CSV pueden venir "sucios":
             * - Espacios extra: "  Juan   Perez  "
             * - Mayúsculas/minúsculas inconsistentes: "JUAN perez"
             * - Formatos incorrectos
             * 
             * Aquí los normalizamos para tener datos consistentes.
             */
            
            // Normalizar nombre del estudiante:
            // "  juan   PEREZ  " → "Juan Perez"
            const studentName = row.student_name
                .trim()                              // Quita espacios al inicio/final
                .replace(/\s+/g, ' ')                // Múltiples espacios → uno solo
                .split(' ')                          // Separa por espacios
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())  // Capitaliza
                .join(' ');                          // Une de nuevo
            
            // Email siempre en minúsculas y sin espacios
            const studentEmail = row.student_email.trim().toLowerCase();
            const studentPhone = row.student_phone.trim();
            
            // Datos del profesor
            const professorName = row.professor_name.trim();
            const professorEmail = row.professor_email.trim().toLowerCase();
            const department = row.department.trim();
            
            // Datos del curso (código en mayúsculas para consistencia)
            const courseCode = row.course_code.trim().toUpperCase();
            const courseName = row.course_name.trim();
            const credits = parseInt(row.credits);      // String → número entero
            
            // Datos de la inscripción
            const semester = row.semester.trim();
            const grade = parseFloat(row.grade);        // String → número decimal
            const tuitionFee = parseInt(row.tuition_fee);
            const amountPaid = parseInt(row.amount_paid);

            // ------------------------------------------------------------
            // 2.2: INSERTAR ESTUDIANTE
            // ------------------------------------------------------------
            /**
             * INSERT ... ON CONFLICT ... DO UPDATE:
             * - Si el email NO existe → INSERT (crea nuevo)
             * - Si el email YA existe → UPDATE (actualiza)
             * 
             * Esto hace la migración IDEMPOTENTE (puedes ejecutarla muchas veces).
             * 
             * RETURNING xmax:
             * xmax es un campo interno de PostgreSQL.
             * Si xmax = 0 → fue INSERT (registro nuevo)
             * Si xmax > 0 → fue UPDATE (registro existente)
             */
            const student_result = await client.query(`
                INSERT INTO "student" ("name", "email", "phone") 
                VALUES ($1, $2, $3) 
                ON CONFLICT ("email")
                DO UPDATE SET name = EXCLUDED.name
                RETURNING xmax
            `, [studentName, studentEmail, studentPhone]);

            // ------------------------------------------------------------
            // 2.3: INSERTAR DEPARTAMENTO
            // ------------------------------------------------------------
            const department_result = await client.query(`
                INSERT INTO "department" ("name") 
                VALUES ($1) 
                ON CONFLICT ("name")
                DO UPDATE SET name = EXCLUDED.name
                RETURNING xmax
            `, [department]);

            // Obtenemos el ID del departamento para usarlo en el profesor
            const departmentId = await client.query(
                `SELECT id FROM department WHERE name = $1`, 
                [department]
            );

            // ------------------------------------------------------------
            // 2.4: INSERTAR PROFESOR
            // ------------------------------------------------------------
            const professor_result = await client.query(`
                INSERT INTO "profesor" ("name", "email", "department_id") 
                VALUES ($1, $2, $3) 
                ON CONFLICT ("email")
                DO UPDATE SET name = EXCLUDED.name
                RETURNING xmax
            `, [professorName, professorEmail, departmentId.rows[0].id]);

            // Obtenemos el ID del profesor para usarlo en el curso
            const profesorId = await client.query(
                `SELECT id FROM profesor WHERE email = $1`, 
                [professorEmail]
            );

            // ------------------------------------------------------------
            // 2.5: INSERTAR CURSO
            // ------------------------------------------------------------
            const course_result = await client.query(`
                INSERT INTO "course" ("code", "name", "credits", "profesor_id") 
                VALUES ($1, $2, $3, $4) 
                ON CONFLICT ("code")
                DO UPDATE SET name = EXCLUDED.name
                RETURNING xmax
            `, [courseCode, courseName, credits, profesorId.rows[0].id]);

            // Obtenemos el ID del estudiante para la inscripción
            const studentId = await client.query(
                `SELECT id FROM student WHERE email = $1`, 
                [studentEmail.toLowerCase()]
            );

            // ------------------------------------------------------------
            // 2.6: INSERTAR INSCRIPCIÓN (ENROLLMENT)
            // ------------------------------------------------------------
            const enrollment_result = await client.query(`
                INSERT INTO "enrrollments" (
                    "enrolmment_id", "semester", "grade", 
                    "tuition_fee", "student_id", "course_code"
                ) 
                VALUES ($1, $2, $3, $4, $5, $6) 
                ON CONFLICT ("enrolmment_id")
                DO UPDATE SET 
                    semester = EXCLUDED.semester,
                    grade = EXCLUDED.grade,
                    tuition_fee = EXCLUDED.tuition_fee,
                    student_id = EXCLUDED.student_id,
                    course_code = EXCLUDED.course_code
                RETURNING xmax
            `, [row.enrolmment_id, semester, grade, tuitionFee, studentId.rows[0].id, courseCode]);

            // ------------------------------------------------------------
            // 2.7: ACTUALIZAR KARDEX EN MONGODB
            // ------------------------------------------------------------
            /**
             * findOneAndUpdate con upsert:
             * - Busca un documento por studentEmail
             * - Si NO existe → lo crea ($setOnInsert)
             * - Siempre agrega el curso al historial ($push)
             * 
             * $setOnInsert: Solo se aplica si es INSERT (documento nuevo)
             * $push: Agrega un elemento al array (siempre se ejecuta)
             */
            await AcademicTranscripts.findOneAndUpdate(
                { "studentEmail": studentEmail },  // Filtro de búsqueda
                {
                    // Solo aplica si es documento nuevo
                    $setOnInsert: {
                        "studentEmail": studentEmail,
                        "studentName": studentName,
                        "summary": {
                            "totalCreditsEarned": 4,    // Valor inicial (se actualiza después)
                            "averageGrade": 4.5         // Valor inicial (se actualiza después)
                        },
                    },
                    // Siempre agrega el curso al historial
                    $push: {
                        "academicHistory": {
                            "courseCode": courseCode,
                            "courseName": courseName,
                            "credits": credits,
                            "semester": semester,
                            "professorName": professorName,
                            "grade": grade,
                            "status": "Aprobado"
                        }
                    }
                },
                { upsert: true }  // Si no existe, créalo
            );
            
            // ------------------------------------------------------------
            // 2.8: ACTUALIZAR CONTADORES
            // ------------------------------------------------------------
            // xmax = '0' significa que fue INSERT (registro nuevo)
            if (student_result.rows[0].xmax === '0') counters.contStudents++;
            if (course_result.rows[0].xmax === '0') counters.contCourses++;
            if (enrollment_result.rows[0].xmax === '0') counters.contEnrollments++;
            if (professor_result.rows[0].xmax === '0') counters.contProfessors++;
            if (department_result.rows[0].xmax === '0') counters.contDepartments++;
        }
        
        // ================================================================
        // PASO 3: ACTUALIZAR RESÚMENES EN MONGODB
        // ================================================================
        /**
         * Ahora que todos los datos están cargados, calculamos:
         * - Total de créditos por estudiante
         * - Promedio de notas por estudiante
         * 
         * Esto se hace con una consulta SQL que agrupa por estudiante.
         */
        let totalCredits = await client.query(`
            SELECT 
                ROUND(AVG(e.grade), 1) as average_grade,
                s.email,
                SUM(c.credits) as total_credits 
            FROM student s 
            JOIN enrrollments e ON s.id = e.student_id                      
            JOIN course c ON e.course_code = c.code 
            GROUP BY s.email;
        `);
        
        // Actualizamos el resumen de cada estudiante en MongoDB
        for (const student of totalCredits.rows) {
            await AcademicTranscripts.updateOne(
                { studentEmail: student.email },
                {
                    $set: {
                        "summary.totalCreditsEarned": parseInt(student.total_credits),
                        "summary.averageGrade": parseFloat(student.average_grade)
                    }
                }
            );
        }

        // Confirmamos todos los cambios
        await client.query('COMMIT');
        
        // Retornamos las estadísticas de la migración
        return counters;

    } catch (error) {
        console.log('❌ Error en migración:', error);
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * ============================================================================
 * CONCEPTOS IMPORTANTES DE ESTE ARCHIVO:
 * ============================================================================
 * 
 * 1. ETL (Extract, Transform, Load)
 *    - Extract: Leer datos de una fuente (CSV)
 *    - Transform: Limpiar y normalizar datos
 *    - Load: Cargar en destino (PostgreSQL, MongoDB)
 * 
 * 2. IDEMPOTENCIA
 *    Una operación es idempotente si ejecutarla múltiples veces
 *    produce el mismo resultado que ejecutarla una vez.
 *    ON CONFLICT ... DO UPDATE logra esto.
 * 
 * 3. TRANSACCIONES
 *    BEGIN/COMMIT/ROLLBACK garantizan que todos los cambios
 *    se aplican juntos o ninguno se aplica.
 * 
 * 4. NORMALIZACIÓN
 *    En lugar de repetir "Ingeniería" en cada profesor,
 *    creamos una tabla department y usamos IDs.
 *    Esto ahorra espacio y evita inconsistencias.
 * 
 * 5. FOREIGN KEYS
 *    Garantizan integridad referencial:
 *    No puedes tener un curso con un profesor que no existe.
 */