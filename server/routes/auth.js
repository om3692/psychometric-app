const express = require('express');
const router = express.Router();

const {
  forwardAuthenticated,
  logoutCleanup
} = require('../middleware/authMiddleware');

const authController = require('../controllers/authController');

// ------------------ AUTH API ROUTES ------------------

// Handle signup: Send OTP to user's email
router.post('/send-otp', authController.sendOtp);

// Handle OTP verification: Create user
router.post('/verify', authController.verifyOtp); // ✅ Added this for <form action="/verify" method="POST">

// Handle user login
router.post('/login', authController.userLogin);

// Handle admin login
router.post('/admin-login', authController.adminLogin);

// ------------------ AUTH VIEW ROUTES ------------------

// Render signup page
router.get('/signup', forwardAuthenticated, (req, res) => {
  res.render('pages/auth/signup');
});

// Render OTP verification page (with email pre-filled)
router.get('/verify', (req, res) => {
  const email = req.query.email;
  res.render('pages/auth/verify', { email });
});

// Render login page
router.get('/login', forwardAuthenticated, (req, res) => {
  res.render('pages/auth/login');
});

// Logout route
router.get('/logout', logoutCleanup);

module.exports = router;
