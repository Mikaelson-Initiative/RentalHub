"use client";

import { useState } from "react";
import { T } from "@/lib/rh/theme";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Field, Input } from "@/components/rh/ui";
import { AuthShell } from "@/components/rh/auth-shell";

export default function ResetPasswordPage() {
  const { go, showToast } = useApp();
  const { mobile } = useViewport();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const ok = pw.length >= 8 && pw === pw2;
  const strength = pw.length >= 12 ? "Strong" : pw.length >= 8 ? "Good" : pw.length > 0 ? "Too short" : "";
  return (
    <AuthShell mobile={mobile} title="Set a new password" sub="Choose a strong password you don't use elsewhere.">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="New password" hint="At least 8 characters."><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Create a password" /></Field>
        {strength && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: -6 }}>
          <div style={{ flex: 1, height: 5, borderRadius: 5, background: T.line, overflow: "hidden" }}><div style={{ width: pw.length >= 12 ? "100%" : pw.length >= 8 ? "66%" : "33%", height: "100%", background: pw.length >= 8 ? T.green : T.gold }} /></div>
          <span style={{ fontFamily: T.sans, fontSize: 11.5, fontWeight: 600, color: pw.length >= 8 ? T.green : T.gold }}>{strength}</span>
        </div>}
        <Field label="Confirm password"><Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Re-enter password" /></Field>
        {pw2 && pw !== pw2 && <span style={{ fontFamily: T.sans, fontSize: 12, color: T.red, marginTop: -8 }}>Passwords don&apos;t match</span>}
        <Button full size="lg" disabled={!ok} onClick={() => { showToast("Password updated — please sign in"); go("login"); }}>Reset password</Button>
      </div>
    </AuthShell>
  );
}
