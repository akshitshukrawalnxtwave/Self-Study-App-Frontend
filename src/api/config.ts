/** Set to false when Django backend is ready (M2). */
export const USE_MOCK_API =
  import.meta.env.VITE_USE_MOCK_API !== 'false';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? '/api';
