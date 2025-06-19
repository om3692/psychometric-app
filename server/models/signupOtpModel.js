const pool = require('../config/db');

// Store or update OTP for a user's email
async function upsertOtp(email, otpCode, hashedPassword, expiresAt) {
  const query = `
    INSERT INTO signupOtps (email, otpCode, hashedPassword, expiresAt)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email)
    DO UPDATE SET otpCode = EXCLUDED.otpCode, hashedPassword = EXCLUDED.hashedPassword, expiresAt = EXCLUDED.expiresAt, createdAt = CURRENT_TIMESTAMP;
  `;
  const values = [email, otpCode, hashedPassword, expiresAt];
  await pool.query(query, values);
}

// Find valid OTP by email
async function findValidOtp(email) {
  const query = `
    SELECT * FROM signupOtps
    WHERE email = $1 AND expiresAt > CURRENT_TIMESTAMP
    ORDER BY createdAt DESC
    LIMIT 1;
  `;
  const result = await pool.query(query, [email]);
  return result.rows[0];
}

// Delete OTP (after signup success or expiry)
async function deleteOtp(email) {
  const query = `DELETE FROM signupOtps WHERE email = $1`;
  await pool.query(query, [email]);
}

module.exports = {
  upsertOtp,
  findValidOtp,
  deleteOtp
};
