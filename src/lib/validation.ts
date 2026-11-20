// Shared validation: CNIC 35202-1234567-1, email, password, image files (max 5 MB).
export const CNIC_RE = /^\d{5}-\d{7}-\d$/;
export const isValidCnic = (v: string) => CNIC_RE.test(v.trim());
export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const isValidPassword = (v: string) => v.length >= 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export type FileError = 'type' | 'size' | null;
export function validateImageFile(f: File): FileError {
  if (!ALLOWED_IMAGE_TYPES.includes(f.type)) return 'type';
  if (f.size > MAX_IMAGE_BYTES) return 'size';
  return null;
}
export function required(v: string | undefined | null) { return !!v && v.trim().length > 0; }
export function isPositiveInt(v: string, min = 1, max = 10) { const n = Number(v); return Number.isInteger(n) && n >= min && n <= max; }
