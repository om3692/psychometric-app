const pool = require('../config/db');

// Create a new admin account (used manually or during setup)
async function createAdmin(email, hashedPassword) {
  const query = `
    INSERT INTO admins (email, password)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const values = [email, hashedPassword];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Find admin by email (for login)
async function findByEmail(email) {
  const query = `SELECT * FROM admins WHERE email = $1`;
  const result = await pool.query(query, [email]);
  return result.rows[0];
}

// Find admin by ID (for session)
async function findById(adminId) {
  const query = `SELECT * FROM admins WHERE adminId = $1`;
  const result = await pool.query(query, [adminId]);
  return result.rows[0];
}

module.exports = {
  createAdmin,
  findByEmail,
  findById
};
