const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// ------------------------------
// Protected Test Routes (User)
// ------------------------------

// Start the test
router.get('/test/start', ensureAuthenticated, testController.startTest);

// Submit test responses
router.post('/test/submit', ensureAuthenticated, testController.submitTest);

// Thank you page after completion
router.get('/test/complete/:id', ensureAuthenticated, testController.thankYouPage);

// Optional: View detailed answers from an attempt
router.get('/test/attempt/:id', ensureAuthenticated, testController.viewAttempt);

module.exports = router;
