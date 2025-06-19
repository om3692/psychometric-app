const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Middleware for parsing
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
}));

// Flash setup (after session)
app.use(flash());

// Make session and error accessible in all EJS views
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.error = req.flash('error');
  next();
});

// Route files
const viewRoutes = require('./routes/views');
const testRoutes = require('./routes/test');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth'); // ✅ Added here

// Mount routes
app.use('/', viewRoutes);
app.use('/', testRoutes);
app.use('/', adminRoutes);
app.use('/', authRoutes); // ✅ Mounted here

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
