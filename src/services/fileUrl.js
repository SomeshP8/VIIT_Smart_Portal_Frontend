/**
 * Returns the full accessible URL for any file stored on the server.
 *
 * Strategy:
 *  - Already-absolute URLs (Cloudinary, S3, https://...): returned unchanged.
 *  - In production: prepends VITE_API_BASE_URL (the backend server URL).
 *  - In development: Vite proxies /uploads → localhost:5000, so keep relative.
 */
export const getFileUrl = (filePath) => {
  if (!filePath) return '';

  // Already an absolute URL — return as-is (Cloudinary, S3, etc.)
  if (/^https?:\/\//i.test(filePath) || filePath.startsWith('data:')) {
    return filePath;
  }

  const normalized = filePath.startsWith('/') ? filePath : `/${filePath}`;

  // In production: prefix with backend origin
  const serverBase = import.meta.env.VITE_API_BASE_URL;
  if (serverBase) {
    return `${serverBase}${normalized}`;
  }

  // In development: Vite proxies /uploads → server, keep relative
  return normalized;
};
