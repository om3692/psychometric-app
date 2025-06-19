const pool = require('../config/db');

// Create a new question set
async function createQuestionSet(setName, description) {
  const query = `
    INSERT INTO questionSets (setName, description)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const values = [setName, description];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Find a question set by name
async function findByName(setName) {
  const query = `SELECT * FROM questionSets WHERE setName = $1`;
  const result = await pool.query(query, [setName]);
  return result.rows[0];
}

// Find the latest question set
async function findLatest() {
  const query = `SELECT * FROM questionSets ORDER BY createdAt DESC LIMIT 1`;
  const result = await pool.query(query);
  return result.rows[0];
}

module.exports = {
  createQuestionSet,
  findByName,
  findLatest
};
