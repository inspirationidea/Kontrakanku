import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_signkey_kontrakanku_2026_change_this';

/**
 * Hash a password using bcryptjs
 * @param {string} password 
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plain password with hashed password
 * @param {string} password 
 * @param {string} hashedPassword 
 * @returns {Promise<boolean>} Match status
 */
export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a JWT access token for a user
 * @param {object} user - User object containing id, email, and role
 * @returns {string} Signed JWT
 */
export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' } // Default access token expiry
  );
};

/**
 * Verify a JWT token
 * @param {string} token 
 * @returns {object} Decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
