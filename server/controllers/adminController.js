const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const questionSetModel = require('../models/questionSetModel');
const questionModel = require('../models/questionModel');
const pool = require('../config/db');
const { Parser } = require('json2csv');

exports.uploadQuestions = async (req, res) => {
  try {
    const file = req.file;
    if (!file || path.extname(file.originalname) !== '.csv') {
      return res.render('pages/admin/upload', { message: '❌ Please upload a valid CSV file.' });
    }

    const setName = req.body.setName || `Set-${Date.now()}`;
    const description = req.body.description || 'Uploaded via Admin';

    const questionSet = await questionSetModel.createQuestionSet(setName, description);
    const questions = [];
    const validTypes = [
      'likert', 'forced_choice', 'ranking', 'multiple_choice',
      'single_choice', 'image_based', 'abstract_stimuli'
    ];

    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (row) => {
        try {
          const type = row.type?.trim().toLowerCase();
          const prompt = row.prompt?.trim();
          const rawNumber = row.questionNumber?.trim();
          const questionNumber = parseInt(rawNumber);

          console.log(`[CSV] Row: type=${type}, prompt="${prompt}", questionNumber=${questionNumber}`);

          // ❌ Skip invalid entries
          if (!type || !prompt || isNaN(questionNumber)) {
            console.warn('❌ Skipping row (invalid fields):', row);
            return;
          }

          if (!validTypes.includes(type)) {
            console.warn('❌ Skipping row (unsupported type):', row);
            return;
          }

          const baseQuestion = {
            setid: questionSet.setid,
            type,
            prompt,
            questionNumber,
            options: null,
            metadata: null
          };

          if (row.options) {
            try {
              baseQuestion.options = JSON.parse(row.options);
            } catch {
              baseQuestion.options = row.options.split(',').map(opt => opt.trim());
            }
          }

          if (row.metadata) {
            try {
              baseQuestion.metadata = JSON.parse(row.metadata);
            } catch {
              baseQuestion.metadata = { raw: row.metadata };
            }
          }

          questions.push(baseQuestion);
        } catch (err) {
          console.error('❌ Error parsing row:', err);
        }
      })
      .on('end', async () => {
        try {
          if (questions.length === 0) {
            return res.render('pages/admin/upload', { message: '⚠️ No valid questions found in the CSV.' });
          }

          await questionModel.bulkInsert(questions);
          fs.unlinkSync(file.path);
          res.render('pages/admin/upload', { message: '✅ Questions uploaded successfully!' });
        } catch (err) {
          console.error('❌ DB insert error:', err);
          res.render('pages/admin/upload', { message: '❌ Error inserting questions. Check data format.' });
        }
      });

  } catch (err) {
    console.error('❌ Upload error:', err);
    res.render('pages/admin/upload', { message: '❌ Unexpected error during upload.' });
  }
};

// 🧾 List all attempts
exports.listAttempts = async (req, res) => {
  try {
    const { email, startDate, endDate } = req.query;

    let query = `
      SELECT ta.attemptId, u.email AS userEmail, qs.setName,
             ta.startedAt, ta.completedAt, ta.durationSeconds
      FROM testAttempts ta
      LEFT JOIN users u ON ta.userId = u.userId
      LEFT JOIN questionSets qs ON ta.setId = qs.setId
      WHERE 1=1
    `;
    const params = [];

    if (email) {
      params.push(email);
      query += ` AND u.email = $${params.length}`;
    }
    if (startDate) {
      params.push(startDate);
      query += ` AND ta.startedAt >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      query += ` AND ta.startedAt <= $${params.length}`;
    }

    query += ` ORDER BY ta.startedAt DESC`;

    const result = await pool.query(query, params);

    res.render('pages/admin/attempts-list', {
      title: 'Test Attempts',
      attempts: result.rows,
      email,
      startDate,
      endDate
    });
  } catch (err) {
    console.error('Admin attempt list error:', err);
    res.status(500).send('Failed to load attempts');
  }
};
exports.exportAttemptsCsv = async (req, res) => {
  try {
    const { email, startDate, endDate } = req.query;

    let query = `
      SELECT ta.attemptId, u.email AS "userEmail", qs.setName AS "setName",
             ta.startedAt AS "startedAt", ta.completedAt AS "completedAt", ta.durationSeconds AS "durationSeconds"
      FROM testAttempts ta
      LEFT JOIN users u ON ta.userId = u.userId
      LEFT JOIN questionSets qs ON ta.setId = qs.setId
      WHERE 1=1
    `;
    const params = [];

    if (email) {
      params.push(email);
      query += ` AND u.email = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND ta.startedAt >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND ta.startedAt <= $${params.length}`;
    }

    query += ` ORDER BY ta.startedAt DESC`;

    const result = await pool.query(query, params);

    // ✅ Match field names to exactly what SELECT returns
    const fields = ['attemptId', 'userEmail', 'setName', 'startedAt', 'completedAt', 'durationSeconds'];
    const parser = new Parser({ fields });

    const csv = parser.parse(result.rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('filtered-attempts.csv');
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).send('Error exporting CSV');
  }
};
