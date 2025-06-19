const {
  ensureAdmin,
  logoutCleanup
} = require('../middleware/authMiddleware');

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../middleware/upload');


// CSV Upload Route (POST)
router.post('/admin/upload', upload.single('csvFile'), adminController.uploadQuestions);

router.get('/admin/attempts', adminController.listAttempts);

router.get('/admin/attempts/export', adminController.exportAttemptsCsv);

// router.get('/admin/upload', ensureAdmin, adminController.renderUploadPage);
router.get('/admin/upload', ensureAdmin, (req, res) => {
  res.render('pages/admin/upload');
});

router.get('/admin/attempts', ensureAdmin, adminController.listAttempts);
router.get('/admin/attempts/export', ensureAdmin, adminController.exportAttemptsCsv);

// Add logout
router.get('/admin/logout', logoutCleanup);


module.exports = router;
