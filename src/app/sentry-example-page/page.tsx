"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { T, I, Logo } from "@/lib/rh/theme";
import { Button, Card, Pill } from "@/components/rh/ui";

class SentryExampleFrontendError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleFrontendError";
  }
}

export default function SentryExamplePage() {
  const [hasSentError, setHasSentError] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    Sentry.logger.info("Sentry example page loaded");
    async function checkConnectivity() {
      const result = await Sentry.diagnoseSdkConnectivity();
      setIsConnected(result !== "sentry-unreachable");
    }
    checkConnectivity();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: T.paper, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card pad={40} style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><Logo /></div>
        <div style={{ display: "flex", justifyContent: "center" }}><Pill tone="clay" icon={I.sparkle}>Diagnostics</Pill></div>
        <h1 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 30, letterSpacing: "-.02em", color: T.ink, margin: "14px 0 0", lineHeight: 1.08 }}>Sentry example page</h1>
        <p style={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink2, lineHeight: 1.6, marginTop: 12 }}>
          Click the button below and view the sample error on your{" "}
          <a target="_blank" rel="noopener" href="https://thasegzyosmcom.sentry.io/issues/?project=4511212300009472" style={{ color: T.clay, fontWeight: 600 }}>Sentry Issues page</a>. It confirms error reporting is wired up correctly.
        </p>

        <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
          <Button size="lg" disabled={!isConnected} icon={I.bolt} onClick={async () => {
            Sentry.logger.info("User clicked the button, throwing a sample error");
            await Sentry.startSpan({ name: "Example Frontend/Backend Span", op: "test" }, async () => {
              try {
                const res = await fetch("/api/sentry-example-api");
                if (!res.ok) setHasSentError(true);
              } catch {
                setHasSentError(true);
              }
            });
            throw new SentryExampleFrontendError("This error is raised on the frontend of the example page.");
          }}>Throw sample error</Button>
        </div>

        <div style={{ marginTop: 18 }}>
          {hasSentError ? (
            <div style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.green, background: T.greenSoft, borderRadius: 10, padding: "12px 16px" }}>Error sent to Sentry.</div>
          ) : !isConnected ? (
            <div style={{ fontFamily: T.sans, fontSize: 13, color: T.red, background: T.redSoft, borderRadius: 10, padding: "12px 16px", lineHeight: 1.5 }}>
              Network requests to Sentry appear to be blocked, which will prevent errors from being captured. Try disabling your ad-blocker to complete the test.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
