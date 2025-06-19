const pool = require('../config/db');

// Save each response individually
async function saveResponses(attemptId, responses) {
  const query = `
    INSERT INTO responses (attemptid, questionid, answer, timespentseconds)
    VALUES ($1, $2, $3, $4)
  `;

  for (const resp of responses) {
    const values = [
      attemptId,
      resp.questionId,
      JSON.stringify(resp.answer),
      resp.timeSpentSeconds || 0
    ];
    await pool.query(query, values);
  }
}

// Get all responses for a given attempt
async function findByAttemptId(attemptId) {
  const query = `
    SELECT r.answer, r.timespentseconds, q.prompt, q.type, q.options, q.metadata
    FROM responses r
    JOIN questions q ON r.questionid = q.questionid
    WHERE r.attemptid = $1
    ORDER BY q.questionnumber ASC
  `;
  const result = await pool.query(query, [attemptId]);

  return result.rows.map(row => ({
    prompt: row.prompt,
    type: row.type,
    options: row.options,
    metadata: row.metadata,
    answer: row.answer,
    timeSpent: row.timespentseconds
  }));
}

module.exports = {
  saveResponses,
  findByAttemptId
};
