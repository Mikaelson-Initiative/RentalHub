"use client";

import { T, I } from "@/lib/rh/theme";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Field, Input } from "@/components/rh/ui";
import { AuthShell } from "@/components/rh/auth-shell";

export default function LoginPage() {
  const { go, showToast } = useApp();
  const { mobile } = useViewport();
  return (
    <AuthShell mobile={mobile} title="Welcome back" sub="Sign in to manage your homes and bookings.">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Email address"><Input type="email" placeholder="you@email.com" defaultValue="chioma.eze@email.com" /></Field>
        <Field label="Password"><Input type="password" placeholder="••••••••" defaultValue="password" /></Field>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: T.sans, fontSize: 13 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 7, color: T.ink2, cursor: "pointer" }}><input type="checkbox" defaultChecked style={{ accentColor: T.clay, width: 15, height: 15 }} /> Remember me</label>
          <span onClick={() => go("forgot")} style={{ color: T.clay, cursor: "pointer", fontWeight: 600 }}>Forgot password?</span>
        </div>
        <Button full size="lg" onClick={() => { showToast("Signed in as Chioma (student)"); go("student"); }}>Sign in</Button>
      </div>

      <div style={{ marginTop: 14 }}>
        <button onClick={() => go("setup-role")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "13px", background: "#fff", border: "1px solid " + T.line, borderRadius: 999, cursor: "pointer", fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, color: T.ink }}>
          <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.8h3.6c2.1-1.9 3.2-4.8 3.2-7.9Z" /><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.8c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.3v2.9A10.9 10.9 0 0 0 12 23Z" /><path fill="#FBBC05" d="M6 14.3a6.5 6.5 0 0 1 0-4.2V7.2H2.3a10.9 10.9 0 0 0 0 9.8L6 14.3Z" /><path fill="#EA4335" d="M12 5.5c1.6 0 3 .5 4.1 1.6l3.1-3.1A10.9 10.9 0 0 0 2.3 7.2L6 10.1c.9-2.6 3.2-4.6 6-4.6Z" /></svg>
          Continue with Google
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "20px 0 0" }}>
        <div style={{ flex: 1, height: 1, background: T.line }} /><span style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink3 }}>or pick a demo role</span><div style={{ flex: 1, height: 1, background: T.line }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
        {([["student", "Student", I.user], ["landlord", "Landlord", I.home], ["admin", "Admin", I.shield]] as const).map(([r, lab, Ic]) => (
          <button key={r} onClick={() => { showToast("Signed in as " + lab); go(r); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "14px 8px", background: "#fff", border: "1px solid " + T.line, borderRadius: 13, cursor: "pointer", fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: T.ink }}>
            <span style={{ color: T.clay }}>{Ic({ width: 20, height: 20 })}</span>{lab}
          </button>
        ))}
      </div>
      <p style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, textAlign: "center", marginTop: 24 }}>
        New here? <span onClick={() => go("register")} style={{ color: T.clay, fontWeight: 600, cursor: "pointer" }}>Create an account</span>
      </p>
    </AuthShell>
  );
}
