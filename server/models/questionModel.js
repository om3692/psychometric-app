const pool = require('../config/db');

// Bulk insert questions
async function bulkInsert(questions) {
  const query = `
    INSERT INTO questions (setid, type, prompt, options, metadata, questionNumber)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const inserted = [];
  for (const q of questions) {
    const values = [
      q.setid,
      q.type,
      q.prompt,
      q.options ? JSON.stringify(q.options) : null,   // ✅ stringify array or object
      q.metadata ? JSON.stringify(q.metadata) : null, // ✅ stringify object
      q.questionNumber
    ];
    const result = await pool.query(query, values);
    inserted.push(result.rows[0]);
  }
  return inserted;
}

async function findBySetId(setId) {
  const query = `SELECT * FROM questions WHERE setId = $1 ORDER BY questionNumber ASC`;
  const result = await pool.query(query, [setId]);

  // Parse options and metadata for each question
  const questions = result.rows.map(q => {
    return {
      ...q,
      options: typeof q.options === 'string' ? safeJsonParse(q.options) : q.options,
      metadata: typeof q.metadata === 'string' ? safeJsonParse(q.metadata) : q.metadata
    };
  });

  return questions;
}

// Utility function for safe JSON parse
function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

module.exports = {
  bulkInsert,
  findBySetId
};
