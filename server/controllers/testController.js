const questionSetModel = require('../models/questionSetModel');
const questionModel = require('../models/questionModel');
const testAttemptModel = require('../models/testAttemptModel');
const responseModel = require('../models/responseModel');

// GET /test/start
exports.startTest = async (req, res) => {
  try {
    const userId = req.query.userId; // should ideally come from session
    const questionSet = await questionSetModel.findLatest();
    const questions = await questionModel.findBySetId(questionSet.setid); // <- patched setid
    const attempt = await testAttemptModel.startAttempt(userId, questionSet.setid);

    console.log("🧠 Questions loaded:", questions.length);
    console.log("Questions fetched:", questions.map(q => q.prompt));

    res.render('pages/test/test', {
      title: 'Psychometric Test',
      questions,
      attemptId: attempt.attemptid,
      userId
    });
  } catch (err) {
    console.error('Start test error:', err);
    res.status(500).send('Failed to start test');
  }
};

// POST /test/submit
exports.submitTest = async (req, res) => {
  try {
    const { attemptId, responses, durationSeconds } = req.body;

    await responseModel.saveResponses(attemptId, responses);
    await testAttemptModel.completeAttempt(attemptId, durationSeconds);

    res.redirect(`/test/complete/${attemptId}`);
  } catch (err) {
    console.error('Submit test error:', err);
    res.status(500).send('Failed to submit test');
  }
};

// GET /test/complete/:id
exports.thankYouPage = (req, res) => {
  res.render('pages/test/thankyou', {
    title: 'Thank You'
  });
};

// GET /test/attempt/:id
exports.viewAttempt = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const responses = await responseModel.findByAttemptId(attemptId);

    res.render('pages/test/attempt-detail', {
      title: 'Attempt Detail',
      responses
    });
  } catch (err) {
    console.error('View attempt error:', err);
    res.status(500).send('Failed to load attempt');
  }
};
