# EjercicioBD
# Simulacro de Prueba de Desempeño: Arquitectura de Persistencia Híbrida "UniGestión"

**Módulo:** Arquitectura de Persistencia
**Cohorte:** M4
**Duración Estimada:** 6-8 horas
**Nivel:** Intermedio-Avanzado

> *"Los datos son el activo más valioso de una institución; la arquitectura define cómo los protegemos y cómo los aprovechamos."*

## 📋 Tabla de Contenidos

1. Información General
2. El Escenario de Crisis
3. Objetivos de Aprendizaje
4. Prerrequisitos
5. El Reto: Análisis y Toma de Decisiones
6. Requerimientos Técnicos Detallados
7. Especificaciones de Implementación
8. Casos de Prueba y Validación
9. Entregables
10. Criterios de Evaluación
11. Instrucciones de Entrega

---

## 📌 1. Información General

**Contexto del Proyecto**

La universidad **"UniGestión"** ha experimentado un crecimiento masivo en sus programas de educación continua y pregrado. Su sistema actual maneja información crítica sobre:
* **Estudiantes:** Datos personales y de contacto.
* **Profesores:** Plantilla docente y sus departamentos o facultades.
* **Cursos/Materias:** Oferta académica, créditos y asignaciones docentes.
* **Inscripciones y Calificaciones:** Registro de materias cursadas por los estudiantes y sus notas.
* **Pagos de Matrículas:** Aranceles cobrados y montos pagados por semestre.

**Situación Actual**

Hasta el semestre pasado, la oficina de registro académico manejaba todo en un gigantesco archivo de Excel exportado a CSV (`simulacro_unigestion_data.csv`). El volumen de datos ha hecho que el sistema colapse en época de inscripciones y grados.

## 🚨 2. El Escenario de Crisis

**Problemas Identificados**

1.  **Inconsistencias en Datos Maestros:**
    * Los datos de profesores y estudiantes se repiten por cada materia inscrita.
    * Si un estudiante cambia de correo, hay que actualizar cientos de filas para mantener la coherencia.
2.  **Rigidez Financiera y Académica:**
    * Calcular los ingresos totales por Facultad/Departamento es un proceso manual propenso a errores.
    * No hay integridad referencial: a veces figuran estudiantes inscritos en cursos con profesores que ya no trabajan en la universidad.
3.  **Escalabilidad Limitada (El problema del Kardex):**
    * Generar el "Kardex" (historial académico completo de un estudiante para su graduación) tarda muchísimo porque requiere escanear todo el archivo filtrando por el nombre del estudiante.

**Tu Misión**

Actuar como **Arquitecto de Datos** y **Desarrollador Backend** para diseñar e implementar una **solución híbrida** que utilice:
* **Motor Relacional (SQL - PostgreSQL):** Para datos estructurados que requieren integridad referencial estricta (Estudiantes, Profesores, Cursos, Pagos).
* **Motor NoSQL (Documental - MongoDB):** Para generar y consultar el Kardex Histórico (transcripts) de forma ultrarrápida, evitando joins complejos en tiempo real.

---

## 🎯 3. Objetivos de Aprendizaje

Al finalizar este simulacro, serás capaz de:
* **Diseñar** esquemas relacionales aplicando formas normales (1FN, 2FN, 3FN).
* **Modelar** estructuras documentales optimizadas para lectura de historiales.
* **Implementar** procesos ETL (Extract, Transform, Load) para migrar datos planos hacia arquitecturas híbridas.
* **Desarrollar** APIs RESTful que interactúen con múltiples motores de bases de datos.

---

## ✅ 4. Prerrequisitos

* **Node.js 18+** instalado.
* **PostgreSQL 12+** y **MongoDB 6+** (locales o en la nube).
* **Postman** o similar.
* Conocimientos sólidos en SQL (JOINs, constraints) y NoSQL (aggregations, embeddings).

---

## 🏗️ 5. El Reto: Análisis y Toma de Decisiones

Deberás proponer una arquitectura justificando:

1.  **Integridad de Datos:** ¿Por qué la relación Estudiante-Curso requiere SQL? ¿Cómo evitas la duplicación del perfil del profesor?
2.  **Rendimiento de Consulta:** ¿Por qué el Kardex académico del estudiante se beneficia de MongoDB?
3.  **Escalabilidad:** ¿Cómo mantendrás sincronizado el nombre de un curso si se actualiza en SQL y ya existe en los historiales de MongoDB?

---

## ⚙️ 6. Requerimientos Técnicos Detallados

### A. Configuración de Persistencia Híbrida

#### A.1 Base de Datos Relacional (PostgreSQL)
* Diseñar esquema aplicando formas normales.
* Crear tablas:
    * `students` (id, name, email, phone)
    * `professors` (id, name, email, department)
    * `courses` (code, name, credits, professor_id)
    * `enrollments` (id, student_id, course_code, semester, grade, tuition_fee, amount_paid)
* Implementar constraints (PK, FK, UNIQUE para emails).

#### A.2 Base de Datos Documental (MongoDB)
* Crear colección: `academic_transcripts`.
* Diseñar el documento optimizado para lectura (Kardex):
    ```json
    {
      "studentEmail": "j.perez@unigestion.edu",
      "studentName": "Juan Perez",
      "academicHistory": [
        {
          "courseCode": "CS101",
          "courseName": "Introducción a la Programación",
          "credits": 4,
          "semester": "2023-1",
          "professorName": "Dra. Ana Silva",
          "grade": 4.5,
          "status": "Aprobado"
        }
      ],
      "summary": {
        "totalCreditsEarned": 4,
        "averageGrade": 4.5
      }
    }
    ```

### B. Proceso de Migración (Bulk Load)

#### B.1 Lógica de Migración
* Procesar el CSV. Estructura esperada:
    `student_name, student_email, student_phone, professor_name, professor_email, department, course_code, course_name, credits, semester, grade, tuition_fee, amount_paid`
* **Deduplicación:** Insertar estudiantes y profesores únicos.
* **Distribución:** Poblar tablas SQL y paralelamente construir e insertar los documentos en NoSQL.
* **Idempotencia:** Si se ejecuta dos veces, no debe duplicar la información.

#### B.2 Endpoint de Migración
* **POST** `/api/simulacro/migrate`
* Debe retornar estadísticas de la migración (cuántos estudiantes, profesores, e historiales se crearon).

### C. API REST y Lógica de Negocio

#### C.1 Gestión de Cursos (SQL)
* **GET** `/api/courses` (Opcional: query param `?department=Ingenieria`)
* **GET** `/api/courses/:code`
* **PUT** `/api/courses/:code` (Si se actualiza el nombre del curso, piensa cómo esto afecta el esquema híbrido).

#### C.2 Reporte Financiero (SQL)
* **GET** `/api/reports/tuition-revenue`
* Debe devolver el total recaudado (`amount_paid`) agrupado por **Departamento/Facultad** de los profesores que dictan las materias.
* Asegurar cálculos exactos mediante consultas SQL con `JOIN` y `GROUP BY`.

#### C.3 Consulta de Kardex/Historial (NoSQL)
* **GET** `/api/students/:email/transcript`
* Lectura rápida de la colección de MongoDB. Debe retornar en menos de 100ms. Retorna 404 si el estudiante no existe.

---

## 🔧 7. Especificaciones de Implementación

**Estructura Recomendada:**
```text
unigestion-api/
├── src/
│   ├── config/ (db connections)
│   ├── services/ (business logic)
│   ├── routes/
│   ├── app.js
│   └── server.js
├── data/
│   └── simulacro_unigestion_data.csv
├── .env.example
├── package.json
└── README.md
