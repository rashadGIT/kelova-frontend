import axios from 'axios';
import { useAuthStore } from '@/lib/store/auth.store';
import { useAdminStore } from '@/lib/store/admin.store';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Read Cognito access token from localStorage (set by OAuth callback).
// Returns null in SSR context or when not authenticated.
function getCognitoAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
  const sub = localStorage.getItem(`CognitoIdentityServiceProvider.${clientId}.LastAuthUser`);
  if (!sub) return null;
  return localStorage.getItem(`CognitoIdentityServiceProvider.${clientId}.${sub}.accessToken`);
}

// Request interceptor: inject auth headers
apiClient.interceptors.request.use((config) => {
  // Cookies are domain-scoped — read the Cognito access token from localStorage and send as Bearer.
  const token = getCognitoAccessToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  // Dev bypass: tell the backend which user to impersonate
  const devUser = process.env.NEXT_PUBLIC_DEV_USER;
  if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' && devUser) {
    config.headers['x-dev-user'] = devUser;
  }
  // Super-admin tenant view: inject x-tenant-id so the backend scopes queries to the selected tenant
  const { activeTenantId } = useAdminStore.getState();
  if (activeTenantId) {
    config.headers['x-tenant-id'] = activeTenantId;
  }
  return config;
});

// Response interceptor: on 401, clear auth state and redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      useAuthStore.getState().clearUser();
      const current = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${current}`;
    }
    return Promise.reject(error);
  },
);
