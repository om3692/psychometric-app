const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated, ensureAdmin } = require('../middleware/authMiddleware');

// ───── Auth Pages ─────
router.get('/', forwardAuthenticated, (req, res) => {
  res.render('pages/home');
});

router.get('/signup', forwardAuthenticated, (req, res) => {
  res.render('pages/auth/signup');
});

router.get('/verify', (req, res) => {
  const email = req.query.email;
  res.render('pages/auth/verify', { email });
});

router.get('/login', forwardAuthenticated, (req, res) => {
  res.render('pages/auth/login');
});

router.get('/admin-login', forwardAuthenticated, (req, res) => {
  res.render('pages/auth/admin-login', {
    error: req.flash('error')
  });
});

// ───── Admin Pages ─────
router.get('/admin/upload', ensureAdmin, (req, res) => {
  res.render('pages/admin/upload');
});

// ───── Test Pages ─────
router.get('/instructions', ensureAuthenticated, (req, res) => {
  res.render('pages/test/instructions');
});

module.exports = router;
