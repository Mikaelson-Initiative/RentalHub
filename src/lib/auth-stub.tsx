"use client";

/**
 * lib/auth-stub.tsx
 *
 * Authentication has moved to the separate backend repository.
 * This is a no-op stand-in for `next-auth/react` so the frontend UI keeps
 * compiling and rendering in its logged-out state. Wire these to the real
 * backend API (e.g. NEXT_PUBLIC_API_URL) when integrating.
 */

import type { ReactNode } from "react";

export interface StubUser {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
}

export type StubSession = { user?: StubUser } | null;

export type SessionStatus = "authenticated" | "unauthenticated" | "loading";

export function useSession(): {
  data: StubSession;
  status: SessionStatus;
  update: (data?: unknown) => Promise<StubSession>;
} {
  return { data: null, status: "unauthenticated", update: () => Promise.resolve(null) };
}

export function signOut(options?: { callbackUrl?: string; redirect?: boolean }): Promise<void> {
  if (typeof window !== "undefined") {
    window.location.href = options?.callbackUrl ?? "/";
  }
  return Promise.resolve();
}

export function signIn(
  _provider?: string,
  options?: { callbackUrl?: string; redirect?: boolean; [key: string]: unknown },
): Promise<{ ok: boolean; error: string | null; status: number; url: string | null }> {
  if (typeof window !== "undefined" && options?.callbackUrl && options?.redirect !== false) {
    window.location.href = options.callbackUrl;
  }
  return Promise.resolve({ ok: false, error: "Auth not available in frontend-only build", status: 200, url: null });
}

export function SessionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
