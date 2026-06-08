"use client";

import { useState } from "react";
import { T } from "@/lib/rh/theme";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Field, Input } from "@/components/rh/ui";
import { AuthShell } from "@/components/rh/auth-shell";

export default function LoginPage() {
  const { go, login, showToast } = useApp();
  const { mobile } = useViewport();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.includes("@") || !password) { setError("Enter your email and password."); return; }
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      showToast(`Signed in as ${u.name}`);
      go(u.role === "ADMIN" ? "admin" : u.role === "LANDLORD" ? "landlord" : "student");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign in failed.";
      if (msg === "EMAIL_NOT_VERIFIED") { go("verify", null, { email: email.trim() }); return; }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell mobile={mobile} title="Welcome back" sub="Sign in to manage your homes and bookings.">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Email address"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" /></Field>
        <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e) => { if (e.key === "Enter") submit(); }} /></Field>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: T.sans, fontSize: 13 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 7, color: T.ink2, cursor: "pointer" }}><input type="checkbox" defaultChecked style={{ accentColor: T.clay, width: 15, height: 15 }} /> Remember me</label>
          <span onClick={() => go("forgot")} style={{ color: T.clay, cursor: "pointer", fontWeight: 600 }}>Forgot password?</span>
        </div>
        {error && <div style={{ fontFamily: T.sans, fontSize: 13, color: T.red, background: T.redSoft, borderRadius: 10, padding: "10px 14px" }}>{error}</div>}
        <Button full size="lg" disabled={loading} onClick={submit}>{loading ? "Signing in…" : "Sign in"}</Button>
      </div>

      <div style={{ marginTop: 14 }}>
        <button onClick={() => showToast("Google sign-in is coming soon")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "13px", background: "#fff", border: "1px solid " + T.line, borderRadius: 999, cursor: "pointer", fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, color: T.ink }}>
          <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.8h3.6c2.1-1.9 3.2-4.8 3.2-7.9Z" /><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.8c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.3v2.9A10.9 10.9 0 0 0 12 23Z" /><path fill="#FBBC05" d="M6 14.3a6.5 6.5 0 0 1 0-4.2V7.2H2.3a10.9 10.9 0 0 0 0 9.8L6 14.3Z" /><path fill="#EA4335" d="M12 5.5c1.6 0 3 .5 4.1 1.6l3.1-3.1A10.9 10.9 0 0 0 2.3 7.2L6 10.1c.9-2.6 3.2-4.6 6-4.6Z" /></svg>
          Continue with Google
        </button>
      </div>

      <p style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, textAlign: "center", marginTop: 24 }}>
        New here? <span onClick={() => go("register")} style={{ color: T.clay, fontWeight: 600, cursor: "pointer" }}>Create an account</span>
      </p>
    </AuthShell>
  );
}
