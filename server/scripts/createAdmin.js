const bcrypt = require('bcryptjs');
const pool = require('../config/db'); // your db connection

const createAdmin = async () => {
  const email = 'psychometrictest26@gmail.com';
  const plainPassword = 'admin123'; // 🔐 CHANGE THIS!
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const query = `
    INSERT INTO admins (email, password)
    VALUES ($1, $2)
    ON CONFLICT (email) DO NOTHING;
  `;

  try {
    await pool.query(query, [email, hashedPassword]);
    console.log('✅ Admin created successfully');
  } catch (err) {
    console.error('❌ Error creating admin:', err);
  } finally {
    process.exit();
  }
};

createAdmin();
