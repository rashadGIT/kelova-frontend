import { signOut } from 'aws-amplify/auth';
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

function clearStaleOAuthState() {
  if (typeof window === 'undefined') return;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
  const prefix = `CognitoIdentityServiceProvider.${clientId}`;
  localStorage.removeItem(`${prefix}.inflightOAuth`);
  localStorage.removeItem(`${prefix}.oauthState`);
  localStorage.removeItem(`${prefix}.oauthPKCE`);
}

// Persist the access token in localStorage under the Amplify-compatible key
// format so the apiClient interceptor can attach it as a Bearer header on all
// subsequent requests (cookies are cross-origin and won't be sent).
function storeAccessToken(accessToken: string) {
  if (typeof window === 'undefined') return;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
  const prefix = `CognitoIdentityServiceProvider.${clientId}`;
  const [, rawClaims] = accessToken.split('.');
  const { username } = JSON.parse(
    atob(rawClaims.replace(/-/g, '+').replace(/_/g, '/')),
  ) as { username: string };
  localStorage.setItem(`${prefix}.LastAuthUser`, username);
  localStorage.setItem(`${prefix}.${username}.accessToken`, accessToken);
}

export async function login(credentials: LoginCredentials): Promise<UserProfile> {
  clearStaleOAuthState();
  await signOut({ global: false }).catch(() => null);

  const loginRes = await apiClient.post<{ accessToken: string }>('/auth/login', {
    email: credentials.email,
    password: credentials.password,
  });
  const { accessToken } = loginRes.data;
  storeAccessToken(accessToken);

  const res = await apiClient.get<UserProfile>('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
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
