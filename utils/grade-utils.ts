import * as crypto from 'crypto';

/**
 * Encrypts a grade before storing it in the database
 * Uses AES-256-GCM encryption with a random initialization vector
 * 
 * @param grade The grade to encrypt (as a number or string)
 * @param userId The user ID to use as part of the encryption key
 * @returns Encrypted grade string in format: iv:encryptedData:authTag
 */
export function encryptGrade(grade: number | string, userId: string): string {
  // Convert grade to string if it's a number
  const gradeStr = typeof grade === 'number' ? grade.toString() : grade;
  
  // Create a deterministic but secure encryption key based on user ID and server secret
  // Try to use the server-side variable first, then fall back to the public one
  const encryptionSecret = process.env.GRADE_ENCRYPTION_SECRET || process.env.NEXT_PUBLIC_GRADE_ENCRYPTION_SECRET;
  
  if (!encryptionSecret) {
    throw new Error('Grade encryption environment variable is not set');
  }
  
  // Create a key using PBKDF2 (deterministic key derivation)
  const salt = encryptionSecret;
  const key = crypto.pbkdf2Sync(userId, salt, 10000, 32, 'sha256');
  
  // Generate a random initialization vector for each encryption
  const iv = crypto.randomBytes(16);
  
  // Create cipher using AES-256-GCM (authenticated encryption)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  // Encrypt the grade
  let encrypted = cipher.update(gradeStr, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get the authentication tag
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Return the IV, encrypted data, and auth tag as a single string
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypts a grade that was encrypted using encryptGrade
 * 
 * @param encryptedGrade The encrypted grade string (iv:encryptedData:authTag)
 * @param userId The user ID used during encryption
 * @returns The decrypted grade as a string
 */
export function decryptGrade(encryptedGrade: string, userId: string): string {
  // Split the encrypted string into its components
  const [ivHex, encryptedData, authTagHex] = encryptedGrade.split(':');
  
  if (!ivHex || !encryptedData || !authTagHex) {
    throw new Error('Invalid encrypted grade format');
  }
  
  // Create key using the same method as encryption
  // Try to use the server-side variable first, then fall back to the public one
  const encryptionSecret = process.env.GRADE_ENCRYPTION_SECRET || process.env.NEXT_PUBLIC_GRADE_ENCRYPTION_SECRET;
  
  if (!encryptionSecret) {
    throw new Error('Grade encryption environment variable is not set');
  }
  
  const salt = encryptionSecret;
  const key = crypto.pbkdf2Sync(userId, salt, 10000, 32, 'sha256');
  
  // Convert hex strings back to Buffers
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  // Create decipher
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  // Decrypt
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Calculates grade point average (GPA) from an array of letter grades
 * 
 * @param grades Array of letter grades (e.g., ['A+', 'B', 'C+'])
 * @returns The calculated GPA on a 4.0 scale
 */
export function calculateGPA(grades: string[]): number {
  if (!grades.length) return 0;
  
  const gradePoints: { [key: string]: number } = {
    'A+': 4.0,
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D': 1.0,
    'D-': 0.7,
    'F': 0.0
  };
  
  let totalPoints = 0;
  let validGrades = 0;
  
  for (const grade of grades) {
    if (grade in gradePoints) {
      totalPoints += gradePoints[grade];
      validGrades++;
    }
  }
  
  return validGrades > 0 ? Number((totalPoints / validGrades).toFixed(2)) : 0;
}

/**
 * Converts a numeric grade to a letter grade
 * 
 * @param numericGrade Numeric grade (0-100)
 * @returns Corresponding letter grade
 */
export function numericToLetterGrade(numericGrade: number): string {
  if (numericGrade >= 90) return 'A+';
  if (numericGrade >= 85) return 'A';
  if (numericGrade >= 80) return 'A-';
  if (numericGrade >= 77) return 'B+';
  if (numericGrade >= 73) return 'B';
  if (numericGrade >= 70) return 'B-';
  if (numericGrade >= 67) return 'C+';
  if (numericGrade >= 63) return 'C';
  if (numericGrade >= 60) return 'C-';
  if (numericGrade >= 57) return 'D+';
  if (numericGrade >= 53) return 'D';
  if (numericGrade >= 50) return 'D-';
  return 'F';
}

/**
 * Determines if a student is in good academic standing based on GPA
 * 
 * @param gpa Current GPA
 * @returns Boolean indicating if student is in good standing
 */
export function isGoodAcademicStanding(gpa: number): boolean {
  return gpa >= 2.0; // Typical threshold for good academic standing
} 