module.exports = {
  // For user routes (like test, dashboard)
  ensureAuthenticated(req, res, next) {
    if (req.session && req.session.user) return next(); // logged-in user
    return res.redirect('/login');
  },

  // For admin routes (like admin upload, attempt list)
  ensureAdmin(req, res, next) {
    if (req.session && req.session.admin) return next(); // logged-in admin
    return res.redirect('/admin-login');
  },

  // To prevent logged-in people from seeing login/signup pages
  forwardAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
      return res.redirect('/instructions'); // redirect users
    }
    if (req.session && req.session.admin) {
      return res.redirect('/admin/upload'); // redirect admins
    }
    return next(); // allow access if not logged in
  },

  // On logout: destroy session and prevent going back
  logoutCleanup(req, res, next) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid'); // remove session cookie
      res.redirect('/'); // go to home page
    });
  }
};
