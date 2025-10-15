import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hashes a plain text password using bcrypt.
 * * @param password The plain text password string.
 * @returns The resulting hash string.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty.');
  }
  
  // Use a promise-based approach for clean async/await syntax
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  return hash;
}

/**
 * Compares a plain text password with a stored hash.
 * * @param password The plain text password entered by the user.
 * @param hash The stored password hash from the database.
 * @returns True if the password matches the hash, false otherwise.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }
  
  // Compares the plain text with the hash
  const isMatch = await bcrypt.compare(password, hash);
  return isMatch;
}
