# 🚀 Hybrid Persistence Architecture - REST API

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/MongoDB-7-green?logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Express.js-5-black?logo=express" alt="Express">
  <img src="https://img.shields.io/badge/Docker-Compose-blue?logo=docker" alt="Docker">
</p>

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Architecture Justification](#-architecture-justification)
3. [Technology Stack](#-technology-stack)
4. [Project Structure](#-project-structure)
5. [Getting Started](#-getting-started)
6. [Environment Configuration](#-environment-configuration)
7. [API Documentation](#-api-documentation)
8. [Database Schemas](#-database-schemas)
9. [ETL Migration Process](#-etl-migration-process)
10. [Docker Configuration](#-docker-configuration)
11. [Development Guide](#-development-guide)
12. [Testing](#-testing)
13. [Troubleshooting](#-troubleshooting)
14. [Resources & References](#-resources--references)
15. [Contributing](#-contributing)
16. [License](#-license)

---

## 📖 Overview

This project implements a **production-ready REST API** using a **hybrid persistence architecture** that combines the strengths of both relational (SQL) and document-based (NoSQL) databases.

### Key Features

- ✅ **Hybrid Data Storage**: PostgreSQL for relational data, MongoDB for document-based queries
- ✅ **ETL Pipeline**: Automated CSV data migration with deduplication
- ✅ **Idempotent Operations**: Safe re-execution without data duplication
- ✅ **RESTful API**: Full CRUD operations with proper HTTP semantics
- ✅ **Docker Ready**: Containerized database setup for consistent environments
- ✅ **Transaction Support**: ACID compliance for critical operations

---

## 🧠 Architecture Justification

### Why Hybrid Persistence?

Modern applications often face conflicting data requirements. This architecture addresses them by using each database for its strengths:

| Requirement | PostgreSQL (SQL) | MongoDB (NoSQL) |
|-------------|------------------|-----------------|
| **Referential Integrity** | ✅ Foreign Keys, Constraints | ❌ No built-in relations |
| **Complex Joins** | ✅ Optimized query planner | ❌ Requires aggregation pipelines |
| **ACID Transactions** | ✅ Full support | ⚠️ Limited (single document) |
| **Read Performance** | ⚠️ Depends on indexes & joins | ✅ O(1) document retrieval |
| **Schema Flexibility** | ❌ Rigid schema required | ✅ Dynamic schema |
| **Historical Records** | ⚠️ Complex queries needed | ✅ Embedded documents |

### Data Distribution Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                              │
│                         (CSV Files)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ETL MIGRATION LAYER                          │
│         (Extract → Transform → Load)                             │
│         • Data cleaning & normalization                          │
│         • Deduplication logic                                    │
│         • Parallel writes to both databases                      │
└─────────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼                       ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│      POSTGRESQL           │   │         MONGODB               │
│   (Operational Data)      │   │    (Read-Optimized Views)     │
├───────────────────────────┤   ├───────────────────────────────┤
│ • Normalized tables       │   │ • Denormalized documents      │
│ • Foreign key relations   │   │ • Embedded arrays             │
│ • Transactional writes    │   │ • Pre-computed aggregates     │
│ • Financial reports       │   │ • Fast historical queries     │
└───────────────────────────┘   └───────────────────────────────┘
```

### When to Use Each Database

| Use Case | Database | Reason |
|----------|----------|--------|
| Create/Update entities | PostgreSQL | Ensures data integrity |
| Delete operations | PostgreSQL | Cascading deletes, constraints |
| Complex aggregations | PostgreSQL | SQL JOINs, GROUP BY |
| Historical records lookup | MongoDB | Single document contains all history |
| Dashboard queries | MongoDB | Pre-aggregated summaries |
| Audit trails | MongoDB | Flexible schema for metadata |

---

## 🔧 Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 5.x | Web framework |
| **pg** | 8.x | PostgreSQL client |
| **Mongoose** | 9.x | MongoDB ODM |
| **dotenv** | 17.x | Environment variables |
| **csv-parser** | 3.x | CSV file processing |

### Databases

| Database | Version | Purpose |
|----------|---------|---------|
| **PostgreSQL** | 16 (Alpine) | Relational data storage |
| **MongoDB** | 7 | Document storage |

### DevOps

| Tool | Purpose |
|------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |

---

## 📁 Project Structure

```
project-root/
│
├── 📂 src/                          # Source code
│   ├── 📂 config/                   # Configuration files
│   │   ├── env.js                   # Environment variable loader
│   │   ├── mongoDB.js               # MongoDB connection handler
│   │   └── postgres.js              # PostgreSQL pool configuration
│   │
│   ├── 📂 models/                   # MongoDB schemas (Mongoose)
│   │   └── transcripts.js           # Document schema definition
│   │
│   ├── 📂 services/                 # Business logic layer
│   │   ├── coursesServices.js       # Course-related operations
│   │   ├── reportsServices.js       # Report generation logic
│   │   ├── migrateService.js        # ETL migration logic
│   │   └── studentsService.js       # Student-related operations
│   │
│   ├── 📂 routes/                   # API route definitions
│   │   ├── courses.js               # /api/courses endpoints
│   │   ├── reports.js               # /api/reports endpoints
│   │   ├── migrate.js               # /api/simulacro endpoints
│   │   └── students.js              # /api/students endpoints
│   │
│   ├── 📂 controller/               # Request handlers (optional)
│   │   └── reportsController.js     # Reports controller
│   │
│   ├── app.js                       # Express application setup
│   └── server.js                    # Server entry point
│
├── 📂 data/                         # Data files
│   ├── *.csv                        # Source data for migration
│   └── script_sql.sql               # SQL schema reference
│
├── .env                             # Environment variables (git-ignored)
├── .env.example                     # Environment template
├── docker-compose.yml               # Docker services configuration
├── package.json                     # Node.js dependencies
└── README.md                        # This file
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))
- **Postman** or similar API client ([Download](https://www.postman.com/))

### Installation Steps

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd <project-directory>
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
```

#### 4. Start Database Containers

```bash
docker-compose up -d
```

#### 5. Verify Containers Are Running

```bash
docker ps
```

Expected output:
```
CONTAINER ID   IMAGE                PORTS                     NAMES
xxxxxxxxxxxx   postgres:16-alpine   0.0.0.0:5434->5432/tcp   postgres-container
xxxxxxxxxxxx   mongo:7              0.0.0.0:27018->27017/tcp  mongo-container
```

#### 6. Start the Application

```bash
npm run dev
```

Expected output:
```
✅ MongoDB connected successfully
✅ PostgreSQL tables verified/created
✅ Server running on http://localhost:3000
```

---

## ⚙️ Environment Configuration

### Required Variables

Create a `.env` file in the project root:

```env
# Server Configuration
PORT=3000

# PostgreSQL Connection
# Format: postgresql://user:password@host:port/database
POSTGRES_URI="postgresql://username:password@localhost:5434/database_name"

# MongoDB Connection
# Format: mongodb://host:port/database
MONGO_URI="mongodb://localhost:27018/database_name"

# Data Source
FILE_DATA_CSV="./data/your_data_file.csv"
```

### Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | HTTP server port |
| `POSTGRES_URI` | **Yes** | - | PostgreSQL connection string |
| `MONGO_URI` | **Yes** | - | MongoDB connection string |
| `FILE_DATA_CSV` | No | `./data/simulacro_unigestion_data2.csv` | Path to CSV data file |

---

## 📡 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Endpoints Overview

| Method | Endpoint | Description | Database |
|--------|----------|-------------|----------|
| `POST` | `/simulacro/migrate` | Execute ETL migration | Both |
| `GET` | `/courses` | List all courses | PostgreSQL |
| `GET` | `/courses/:code` | Get course by code | PostgreSQL |
| `PATCH` | `/courses/:code` | Update course | PostgreSQL |
| `GET` | `/reports/tuition-revenue` | Financial report | PostgreSQL |
| `GET` | `/students/:email/transcript` | Student transcript | MongoDB |

---

### POST `/api/simulacro/migrate`

Executes the ETL migration process from CSV to databases.

**Request:**
```http
POST /api/simulacro/migrate
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "message": "Migration completed successfully",
  "counters": {
    "contStudents": 150,
    "contProfessors": 8,
    "contCourses": 10,
    "contEnrollments": 1000,
    "contDepartments": 5
  }
}
```

---

### GET `/api/courses`

Retrieves all courses with professor information.

**Request:**
```http
GET /api/courses
```

**Response (200 OK):**
```json
{
  "message": "Courses retrieved successfully",
  "courses": [
    {
      "code": "CS101",
      "name": "Introduction to Programming",
      "credits": 4,
      "profesor_name": "Dr. Ana Silva"
    }
  ]
}
```

---

### GET `/api/courses/:code`

Retrieves a specific course by its code.

**Request:**
```http
GET /api/courses/CS101
```

**Response (200 OK):**
```json
{
  "message": "Course retrieved successfully",
  "course": {
    "code": "CS101",
    "name": "Introduction to Programming",
    "credits": 4,
    "profesor_name": "Dr. Ana Silva"
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Course not found"
}
```

---

### PATCH `/api/courses/:code`

Partially updates a course.

**Request:**
```http
PATCH /api/courses/CS101
Content-Type: application/json

{
  "name": "Advanced Programming",
  "credits": 5
}
```

**Response (200 OK):**
```json
{
  "message": "Course updated successfully"
}
```

---

### GET `/api/reports/tuition-revenue`

Generates a financial report grouped by department.

**Request:**
```http
GET /api/reports/tuition-revenue
```

**Response (200 OK):**
```json
{
  "message": "Report retrieved successfully",
  "report": [
    {
      "facultad": "Engineering",
      "totalrecaudo": "4800000"
    },
    {
      "facultad": "Humanities",
      "totalrecaudo": "2400000"
    }
  ]
}
```

---

### GET `/api/students/:email/transcript`

Retrieves the complete academic transcript from MongoDB.

**Request:**
```http
GET /api/students/j.perez@example.edu/transcript
```

**Response (200 OK):**
```json
{
  "message": "Transcript retrieved successfully",
  "responseTimeMs": 15,
  "transcript": {
    "studentEmail": "j.perez@example.edu",
    "studentName": "Juan Perez",
    "academicHistory": [
      {
        "courseCode": "CS101",
        "courseName": "Introduction to Programming",
        "credits": 4,
        "semester": "2023-1",
        "professorName": "Dr. Ana Silva",
        "grade": 4.5,
        "status": "Approved"
      }
    ],
    "summary": {
      "totalCreditsEarned": 24,
      "averageGrade": 4.2
    }
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Student not found",
  "searchedEmail": "nonexistent@example.edu"
}
```

---

## 🗃️ Database Schemas

### PostgreSQL Schema

```sql
-- Students table
CREATE TABLE student (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL
);

-- Departments table
CREATE TABLE department (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Professors table
CREATE TABLE profesor (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    department_id INTEGER REFERENCES department(id)
);

-- Courses table
CREATE TABLE course (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    credits SMALLINT NOT NULL,
    profesor_id INTEGER REFERENCES profesor(id)
);

-- Enrollments table
CREATE TABLE enrollments (
    enrollment_id VARCHAR(20) PRIMARY KEY,
    semester VARCHAR(15) NOT NULL,
    grade DECIMAL(2,1) NOT NULL,
    tuition_fee INTEGER NOT NULL,
    student_id INTEGER REFERENCES student(id),
    course_code VARCHAR(20) REFERENCES course(code)
);
```

### MongoDB Schema

```javascript
// Academic Transcripts Collection
{
  studentEmail: String,      // Unique identifier
  studentName: String,
  academicHistory: [{
    courseCode: String,
    courseName: String,
    credits: Number,
    semester: String,
    professorName: String,
    grade: Number,
    status: String           // "Approved", "Failed", "In Progress"
  }],
  summary: {
    totalCreditsEarned: Number,
    averageGrade: Number
  }
}
```

---

## 🔄 ETL Migration Process

The migration process follows the ETL (Extract, Transform, Load) pattern:

### 1. Extract
- Reads CSV file using streams (memory efficient)
- Parses each row into JavaScript objects

### 2. Transform
- **Data Cleaning**: Trims whitespace, normalizes casing
- **Deduplication**: Prevents duplicate entries
- **Validation**: Ensures data integrity

### 3. Load
- **PostgreSQL**: Inserts normalized data with `ON CONFLICT` for idempotency
- **MongoDB**: Creates/updates denormalized documents with `findOneAndUpdate`

### Idempotency

The migration is idempotent - running it multiple times produces the same result:

```sql
-- PostgreSQL uses ON CONFLICT
INSERT INTO student (name, email, phone)
VALUES ($1, $2, $3)
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
RETURNING xmax;  -- xmax = 0 means INSERT, > 0 means UPDATE
```

```javascript
// MongoDB uses upsert
await Collection.findOneAndUpdate(
  { studentEmail: email },
  { $set: {...}, $push: {...} },
  { upsert: true }
);
```

---

## 🐳 Docker Configuration

### docker-compose.yml

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres-container
    restart: unless-stopped
    environment:
      POSTGRES_USER: your_user
      POSTGRES_PASSWORD: your_password
      POSTGRES_DB: your_database
    ports:
      - "5434:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mongo:
    image: mongo:7
    container_name: mongo-container
    restart: unless-stopped
    ports:
      - "27018:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  postgres_data:
  mongo_data:
```

### Docker Commands Reference

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start containers in background |
| `docker-compose down` | Stop and remove containers |
| `docker-compose down -v` | Stop containers and delete volumes |
| `docker-compose logs -f` | Follow container logs |
| `docker ps` | List running containers |
| `docker exec -it <container> psql -U user -d db` | Access PostgreSQL CLI |
| `docker exec -it <container> mongosh` | Access MongoDB shell |

---

## 💻 Development Guide

### Adding a New Endpoint

#### Step 1: Create the Service

```javascript
// src/services/myService.js
import { pool } from "../config/postgres.js";

export async function getAll() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query('SELECT * FROM my_table');
        await client.query('COMMIT');
        return result.rows;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}
```

#### Step 2: Create the Route

```javascript
// src/routes/myRoute.js
import { Router } from "express";
import { getAll } from "../services/myService.js";

const router = Router();

router.get('/', async (req, res) => {
    try {
        const data = await getAll();
        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
```

#### Step 3: Register the Route

```javascript
// src/app.js
import myRouter from "./routes/myRoute.js";
app.use('/api/my-endpoint', myRouter);
```

---

## 🧪 Testing

### Manual Testing with Postman

1. Import the collection or create requests manually
2. Set environment variable: `{{base_url}}` = `http://localhost:3000`
3. Test sequence:
   - POST `/api/simulacro/migrate` (run first)
   - GET `/api/courses`
   - GET `/api/students/:email/transcript`

### Testing with cURL

```bash
# Migrate data
curl -X POST http://localhost:3000/api/simulacro/migrate

# Get all courses
curl http://localhost:3000/api/courses

# Get student transcript
curl http://localhost:3000/api/students/j.perez@example.edu/transcript
```

---

## 🔧 Troubleshooting

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Database not running | Run `docker-compose up -d` |
| `Missing environment variable` | `.env` not configured | Copy `.env.example` to `.env` |
| `relation does not exist` | Tables not created | Restart server (auto-creates tables) |
| `MongooseServerSelectionError` | Wrong MongoDB URI | Check `MONGO_URI` in `.env` |

### Checking Container Logs

```bash
# PostgreSQL logs
docker logs postgres-container

# MongoDB logs  
docker logs mongo-container
```

---

## 📚 Resources & References

### Documentation

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Docker Documentation](https://docs.docker.com/)

### Learning Resources

- [REST API Best Practices](https://restfulapi.net/)
- [Database Normalization](https://www.guru99.com/database-normalization.html)
- [SQL vs NoSQL](https://www.mongodb.com/nosql-explained/nosql-vs-sql)
- [Docker for Beginners](https://docker-curriculum.com/)

### Tools

- [Postman](https://www.postman.com/) - API testing
- [DBeaver](https://dbeaver.io/) - Database GUI for PostgreSQL
- [MongoDB Compass](https://www.mongodb.com/products/compass) - MongoDB GUI

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Convention

```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Example: feat(api): add student enrollment endpoint
```

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">
  Made with ❤️ using Node.js, PostgreSQL, and MongoDB
</p>
