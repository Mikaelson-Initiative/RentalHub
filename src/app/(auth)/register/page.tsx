"use client";

import { useState } from "react";
import { T, I } from "@/lib/rh/theme";
import { CAMPUSES } from "@/lib/rh/data";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Field, Input, Select } from "@/components/rh/ui";
import { AuthShell } from "@/components/rh/auth-shell";
import { registerUser } from "@/lib/rh/api";

export default function RegisterPage() {
  const { go } = useApp();
  const { mobile } = useViewport();
  const [acctRole, setAcctRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!name.trim() || !email.includes("@") || password.length < 8) {
      setError("Enter your name, a valid email, and a password of at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await registerUser({ name: name.trim(), email: email.trim(), password, role: acctRole.toUpperCase() });
      go("verify", null, { role: acctRole, email: email.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell mobile={mobile} title="Create your account" sub="It takes a minute. You'll verify your email next.">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        {([["student", "I’m a student", "Find & book a home", I.user], ["landlord", "I’m a landlord", "List my property", I.home]] as const).map(([r, t, d, Ic]) => (
          <div key={r} onClick={() => setAcctRole(r)} style={{ padding: 16, borderRadius: 14, cursor: "pointer", background: acctRole === r ? T.claySoft : "#fff", border: "1.5px solid " + (acctRole === r ? T.clay : T.line) }}>
            <span style={{ color: acctRole === r ? T.clay : T.ink2 }}>{Ic({ width: 22, height: 22 })}</span>
            <div style={{ fontFamily: T.sans, fontSize: 14.5, fontWeight: 700, color: T.ink, marginTop: 10 }}>{t}</div>
            <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink2, marginTop: 2 }}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chioma Eze" /></Field>
        <Field label="Email address"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" /></Field>
        {acctRole === "student" && <Field label="School"><Select defaultValue="bouesti">{CAMPUSES.map((c) => <option key={c.id} value={c.id}>{c.name}{c.live ? "" : " (coming soon)"}</option>)}</Select></Field>}
        <Field label="Phone number"><Input placeholder="0803 000 0000" /></Field>
        <Field label="Password" hint="At least 8 characters."><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" /></Field>
        {error && <div style={{ fontFamily: T.sans, fontSize: 13, color: T.red, background: T.redSoft, borderRadius: 10, padding: "10px 14px" }}>{error}</div>}
        <Button full size="lg" disabled={loading} onClick={submit}>{loading ? "Creating account…" : "Create account"}</Button>
      </div>
      <p style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, textAlign: "center", marginTop: 20 }}>
        Already have an account? <span onClick={() => go("login")} style={{ color: T.clay, fontWeight: 600, cursor: "pointer" }}>Sign in</span>
      </p>
    </AuthShell>
  );
}
