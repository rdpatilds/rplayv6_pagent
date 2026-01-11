/**
 * Shared Validation Utilities
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters
  return password.length >= 8;
}

export function isValidPasswordStrong(password: string): boolean {
  // At least 8 characters, contains uppercase, lowercase, number, and special char
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isValidDifficultyLevel(level: number): boolean {
  return Number.isInteger(level) && level >= 1 && level <= 5;
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
