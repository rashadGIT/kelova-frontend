'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';

const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? '';
const REDIRECT_URI =
  typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : 'http://localhost:3000/auth/callback';

// Amplify v6 stores the PKCE verifier under this key
const PKCE_KEY = `CognitoIdentityServiceProvider.${CLIENT_ID}.oauthPKCE`;

interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64);
}

function parseJwt(token: string): Record<string, unknown> {
  const [, payload] = token.split('.');
  return JSON.parse(base64UrlDecode(payload));
}

function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Exchanging authorization code…');
  const exchanged = useRef(false);

  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;
    const urlError = searchParams.get('error_description') ?? searchParams.get('error');
    if (urlError) {
      setError(decodeURIComponent(urlError));
      return;
    }

    const code = searchParams.get('code');
    if (!code) {
      setError('No authorization code found in URL.');
      return;
    }

    const codeVerifier = localStorage.getItem(PKCE_KEY);
    if (!codeVerifier) {
      setError('PKCE verifier missing — please try signing in again.');
      return;
    }

    async function exchangeCode() {
      try {
        setStatus('Contacting Cognito…');
        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: CLIENT_ID,
          code: code!,
          redirect_uri: REDIRECT_URI,
          code_verifier: codeVerifier!,
        });

        const res = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Token exchange failed (${res.status}): ${text}`);
        }

        const tokens: TokenResponse = await res.json();
        setStatus('Parsing token…');

        // Store tokens so apiClient can send Bearer on the sync call
        const idPayload = parseJwt(tokens.id_token);
        const sub = idPayload.sub as string;
        const prefix = `CognitoIdentityServiceProvider.${CLIENT_ID}.${sub}`;
        localStorage.setItem(`${prefix}.idToken`, tokens.id_token);
        localStorage.setItem(`${prefix}.accessToken`, tokens.access_token);
        localStorage.setItem(`${prefix}.refreshToken`, tokens.refresh_token);
        localStorage.setItem(`CognitoIdentityServiceProvider.${CLIENT_ID}.LastAuthUser`, sub);

        // Provision / sync the user into the DB (creates row on first Google login)
        setStatus('Syncing account…');
        const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
        const syncRes = await fetch(`${API_URL}/auth/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: tokens.access_token, idToken: tokens.id_token }),
        });
        if (!syncRes.ok) {
          const text = await syncRes.text();
          throw new Error(`Account sync failed (${syncRes.status}): ${text}`);
        }
        const profile = await syncRes.json() as { id: string; email: string; name: string; role: string; tenantId: string };

        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          tenantId: profile.tenantId,
        });

        // Clean up PKCE state
        localStorage.removeItem(PKCE_KEY);
        localStorage.removeItem(`CognitoIdentityServiceProvider.${CLIENT_ID}.oauthState`);
        localStorage.removeItem(`CognitoIdentityServiceProvider.${CLIENT_ID}.inflightOAuth`);

        window.location.href = profile.role === 'super_admin' ? '/super-admin/tenants' : '/';
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[callback] exchange error:', msg);
        setError(msg);
      }
    }

    exchangeCode();
  }, [searchParams, setUser]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="max-w-sm space-y-2">
          <p className="font-medium text-destructive">Sign-in failed</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <a href="/login" className="text-sm underline text-muted-foreground">
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
