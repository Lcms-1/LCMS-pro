// Central API base URL for all backend requests.
//
// In the AI Studio preview and the hosted web version, the frontend and
// backend share the same origin, so VITE_API_BASE_URL can be left unset
// and this resolves to an empty string (requests stay relative, unchanged
// from before).
//
// In the packaged Android and Desktop apps, there is no backend running
// on the device itself, so VITE_API_BASE_URL must be set (see .env) to
// the live hosted Cloud Run server URL, e.g.:
//   VITE_API_BASE_URL=https://your-cloud-run-url.run.app
//
// Every fetch() call to the backend should go through apiUrl() so it
// automatically works correctly in both environments.
export const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || '';

export function apiUrl(path: string): string {
  if (!path.startsWith('/')) path = '/' + path;
  return `${API_BASE}${path}`;
}
