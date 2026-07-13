/** Set to true for frontend-only development without a backend. */
export const USE_MOCK_API =
  import.meta.env.VITE_USE_MOCK_API === 'true';

/** JSON API base — all Django endpoints live under /api/... */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || '/api';
