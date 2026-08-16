// Cliente Better-Auth para o front-end.
// Aponta para o backend via proxy do Vite (ver vite.config.ts).
//
// Docs: https://www.better-auth.com/docs/installation

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
});
