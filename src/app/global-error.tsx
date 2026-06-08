"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { T, I, Logo } from "@/lib/rh/theme";

// Renders its own <html>/<body> (replaces the root layout on a global error),
// so it can't use the app providers/fonts — token fallbacks keep it on-brand.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#F4EEE4", fontFamily: T.sans, WebkitFontSmoothing: "antialiased" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", border: "1px solid rgba(33,29,24,.12)", borderRadius: 18, padding: 40, maxWidth: 460, width: "100%", textAlign: "center", boxShadow: "0 18px 40px -28px rgba(33,29,24,.5)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}><Logo /></div>
            <div style={{ width: 76, height: 76, borderRadius: 999, background: T.claySoft, color: T.clay, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>{I.shieldAlert({ width: 36, height: 36 })}</div>
            <h1 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 32, letterSpacing: "-.02em", color: T.ink, margin: 0, lineHeight: 1.08 }}>Something went wrong</h1>
            <p style={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink2, lineHeight: 1.6, marginTop: 12 }}>
              We&apos;ve been notified about this issue and our team is working to fix it. Please try again in a moment.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 26 }}>
              <button onClick={() => window.location.reload()} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "15px 28px", borderRadius: 999, border: "1px solid " + T.clay, background: T.clay, color: "#fff", fontFamily: T.sans, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Try again</button>
              <button onClick={() => { window.location.href = "/"; }} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "15px 28px", borderRadius: 11, border: "1px solid rgba(33,29,24,.12)", background: "transparent", color: T.ink, fontFamily: T.sans, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Go back home</button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
