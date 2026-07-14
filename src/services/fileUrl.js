/**
 * Returns the full accessible URL for any file stored on the server.
 *
 * Strategy:
 *  - In development: Vite proxies both `/api` AND `/uploads` to localhost:5000,
 *    so we can keep the relative path as-is — the browser hits it through Vite.
 *  - For already-absolute URLs (Cloudinary, etc.): returned unchanged.
 *  - VITE_API_BASE_URL can be set in production to point at the deployed server.
 */
export const getFileUrl = (filePath) => {
  if (!filePath) return '';

  // Already an absolute URL — return as-is (Cloudinary, S3, etc.)
  if (/^https?:\/\//i.test(filePath) || filePath.startsWith('data:')) {
    return filePath;
  }

  // In production: use VITE_API_BASE_URL if provided
  const serverBase = import.meta.env.VITE_API_BASE_URL;
  if (serverBase) {
    return `${serverBase}${filePath.startsWith('/') ? filePath : `/${filePath}`}`;
  }

  // In development: Vite proxies /uploads → server, so keep relative path
  return filePath.startsWith('/') ? filePath : `/${filePath}`;
};
