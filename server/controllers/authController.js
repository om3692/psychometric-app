const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const userModel = require('../models/userModel');
const adminModel = require('../models/adminModel');
const otpModel = require('../models/signupOtpModel');

// ------------------------------
// OTP Email Setup
// ------------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ------------------------------
// Send OTP (User Signup Step 1)
// ------------------------------
exports.sendOtp = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      req.flash('error', 'User already exists');
      return res.redirect('/signup');
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const hashedPassword = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    await otpModel.upsertOtp(email, otpCode, hashedPassword, expiresAt);

    await transporter.sendMail({
      from: `"Psychometric App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP for Psychometric App is: ${otpCode}`
    });

    return res.redirect(`/verify?email=${encodeURIComponent(email)}`);
  } catch (err) {
    console.error('OTP send error:', err);
    req.flash('error', 'Failed to send OTP');
    res.redirect('/signup');
  }
};

// ------------------------------
// Verify OTP and Create User (Signup Step 2)
// ------------------------------
exports.verifyOtp = async (req, res) => {
  const { email, otpCode } = req.body;

  try {
    const record = await otpModel.findValidOtp(email);

    if (!record || record.otpcode !== otpCode) {
      req.flash('error', 'Invalid or expired OTP');
      return res.redirect(`/verify?email=${encodeURIComponent(email)}`);
    }

    await userModel.createUser(email, record.hashedpassword);
    await otpModel.deleteOtp(email);

    req.session.user = { email }; // Optional: can store userId after fetching
    return res.redirect('/instructions');
  } catch (err) {
    console.error('OTP verify error:', err);
    req.flash('error', 'Failed to verify OTP');
    res.redirect(`/verify?email=${encodeURIComponent(email)}`);
  }
};

// ------------------------------
// Admin Login
// ------------------------------
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  console.log("[ADMIN LOGIN] Attempt from:", email);

  try {
    const admin = await adminModel.findByEmail(email);
    if (!admin) {
      console.log("[ADMIN LOGIN] Admin not found");
      req.flash('error', 'Admin not found');
      return res.redirect('/admin-login');
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.log("[ADMIN LOGIN] Password mismatch");
      req.flash('error', 'Invalid credentials');
      return res.redirect('/admin-login');
    }

    req.session.admin = { adminId: admin.adminid, email: admin.email };
    console.log("[ADMIN LOGIN] Login successful. Redirecting...");
    return res.redirect('/admin/upload');
  } catch (err) {
    console.error("[ADMIN LOGIN] Error:", err);
    req.flash('error', 'Login failed');
    res.redirect('/admin-login');
  }
};

// === User Login === 
exports.userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findByEmail(email);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    // ✅ Set session after successful login
    req.session.user = { userId: user.userid, email: user.email };

    // ✅ Redirect to instructions page
    return res.redirect('/instructions');
  } catch (err) {
    console.error('User login error:', err);
    req.flash('error', 'Login failed');
    res.redirect('/login');
  }
};

