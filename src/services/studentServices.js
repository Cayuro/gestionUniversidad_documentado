import { pool } from "../config/postgres.js";

async function getStudents() {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const result = await client.query('select  p."name" as profesor_name  FROM "course" c join profesor p on c.profesor_id = p.id ;')
        await client.query('COMMIT')
        return result.rows
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

async function getCoursesByCode(code) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const result = await client.query('select c.code , c.name, c.credits , p."name" as profesor_name  FROM "course" c join profesor p on c.profesor_id = p.id  WHERE c.code = $1;',[code])
        await client.query('COMMIT')
        
        return result.rows[0]
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

async function updateCourseByCode(data,code) {
     const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const result = await client.query('update course c set name = COALESCE($1,name), credits = COALESCE($2,credits), profesor_id = COALESCE($3,profesor_id) where c.code = $4', [data.name , data.credits, data.profesor_id ,code])
        await client.query('COMMIT')
        
        return result.rows[0]
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}


export { getCourses, getCoursesByCode, updateCourseByCode}