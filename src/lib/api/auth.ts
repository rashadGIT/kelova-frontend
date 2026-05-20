import { signIn, signOut } from 'aws-amplify/auth';
import { apiClient } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

// Amplify throws "redirect is coming from a different origin" when it finds
// stale inflightOAuth state from a previous (possibly cross-origin) Google attempt.
// Clear it before any Amplify auth call so both flows start clean.
function clearStaleOAuthState() {
  if (typeof window === 'undefined') return;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
  const prefix = `CognitoIdentityServiceProvider.${clientId}`;
  localStorage.removeItem(`${prefix}.inflightOAuth`);
  localStorage.removeItem(`${prefix}.oauthState`);
  localStorage.removeItem(`${prefix}.oauthPKCE`);
}

// Login flow:
// 1. Authenticate (Cognito in prod, no-op in dev)
// 2. Backend sets access_token as httpOnly cookie on its /auth/login endpoint
// 3. Fetch /auth/me to get user metadata for the Zustand store
// The token itself never touches the browser JS context in production.
export async function login(credentials: LoginCredentials): Promise<UserProfile> {
  clearStaleOAuthState();
  // Clear any existing Amplify session before signing in to avoid
  // "There is already a signed in user" error from stale OAuth state.
  await signOut({ global: false }).catch(() => null);
  await signIn({ username: credentials.email, password: credentials.password });
  await apiClient.post('/auth/login', {
    email: credentials.email,
    password: credentials.password,
  });
  const res = await apiClient.get<UserProfile>('/auth/me');
  return res.data;
}

export async function logout(): Promise<void> {
  await signOut().catch(() => null);
  await apiClient.post('/auth/logout').catch(() => null);
  // Clear any Amplify-compatible tokens stored by the OAuth callback
  if (typeof window !== 'undefined') {
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
    const prefix = `CognitoIdentityServiceProvider.${clientId}`;
    const sub = localStorage.getItem(`${prefix}.LastAuthUser`);
    if (sub) localStorage.removeItem(`${prefix}.${sub}.accessToken`);
    localStorage.removeItem(`${prefix}.LastAuthUser`);
  }
}

export async function getMe(): Promise<UserProfile> {
  const res = await apiClient.get<UserProfile>('/auth/me');
  return res.data;
}
