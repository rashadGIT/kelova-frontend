'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { useAdminStore } from '@/lib/store/admin.store';

const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';

// Amplify v6 stores the PKCE verifier under this key
const PKCE_KEY = `CognitoIdentityServiceProvider.${CLIENT_ID}.oauthPKCE`;


function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const exitTenantView = useAdminStore((s) => s.exitTenantView);
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
        setStatus('Completing sign-in…');

        // Token exchange happens server-side — avoids browser CORS restrictions
        // on the Cognito /oauth2/token endpoint.
        const redirectUri = `${window.location.origin}/auth/callback`;
        const res = await fetch(`/api/auth/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            code: code!,
            codeVerifier: codeVerifier!,
            redirectUri,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Sign-in failed (${res.status}): ${text}`);
        }

        const profile = await res.json() as { id: string; email: string; name: string; role: string; tenantId: string; picture?: string; accessToken: string; cognitoSub: string };

        // Store the Cognito access token in localStorage using the same keys Amplify uses
        // so getCognitoAccessToken() in apiClient can find it for subsequent API calls.
        const prefix = `CognitoIdentityServiceProvider.${CLIENT_ID}`;
        localStorage.setItem(`${prefix}.LastAuthUser`, profile.cognitoSub);
        localStorage.setItem(`${prefix}.${profile.cognitoSub}.accessToken`, profile.accessToken);

        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          tenantId: profile.tenantId,
          picture: profile.picture,
        });
        exitTenantView();

        // Clean up PKCE state
        localStorage.removeItem(PKCE_KEY);
        localStorage.removeItem(`${prefix}.oauthState`);
        localStorage.removeItem(`${prefix}.inflightOAuth`);

        window.location.href = profile.role === 'super_admin' ? '/super-admin/tenants' : '/';
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console
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
