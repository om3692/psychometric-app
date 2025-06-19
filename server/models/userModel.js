const pool = require('../config/db');

// Create a new verified user after OTP
async function createUser(email, hashedPassword) {
  const query = `
    INSERT INTO users (email, password, isVerified)
    VALUES ($1, $2, TRUE)
    RETURNING *;
  `;
  const result = await pool.query(query, [email, hashedPassword]);
  return result.rows[0];
}

// Find user by email
async function findByEmail(email) {
  const query = `SELECT * FROM users WHERE email = $1`;
  const result = await pool.query(query, [email]);
  return result.rows[0];
}

// Find user by ID
async function findById(userId) {
  const query = `SELECT * FROM users WHERE userId = $1`;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

module.exports = {
  createUser,
  findByEmail,
  findById
};
