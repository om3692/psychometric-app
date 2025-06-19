const pool = require('../config/db');

// Start a new test attempt
async function startAttempt(userId, setId) {
  const query = `
    INSERT INTO testAttempts (userId, setId, startedAt, completedAt)
    VALUES ($1, $2, NOW(), NULL)
    RETURNING *;
  `;
  const values = [userId, setId];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Mark test as complete
async function completeAttempt(attemptId, durationSeconds) {
  const query = `
    UPDATE testAttempts
    SET completedAt = NOW(), durationSeconds = $2
    WHERE attemptId = $1
    RETURNING *;
  `;
  const values = [attemptId, durationSeconds || null];
  const result = await pool.query(query, values);
  return result.rows[0];
}

module.exports = {
  startAttempt,
  completeAttempt
};
