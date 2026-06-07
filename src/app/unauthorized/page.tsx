"use client";

import { T, I } from "@/lib/rh/theme";
import { useApp } from "@/components/rh/app";
import { Button } from "@/components/rh/ui";
import { StatusPage } from "@/components/rh/status-page";

export default function UnauthorizedPage() {
  const { go } = useApp();
  return (
    <StatusPage icon={I.shieldAlert} tone="red" title="Access denied"
      actions={<><Button size="lg" variant="dark" onClick={() => go("login")}>Sign in with another account</Button><Button variant="outline" onClick={() => go("home")}>Go to homepage</Button></>}>
      <p style={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink2, lineHeight: 1.6, marginTop: 12 }}>You don&apos;t have permission to view this page. If you think this is a mistake, make sure you&apos;re signed in with the right account.</p>
    </StatusPage>
  );
}
