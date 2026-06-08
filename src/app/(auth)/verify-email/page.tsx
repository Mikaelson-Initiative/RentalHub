"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { T, I } from "@/lib/rh/theme";
import { useApp, useViewport } from "@/components/rh/app";
import { Button } from "@/components/rh/ui";
import { AuthShell } from "@/components/rh/auth-shell";
import { verifyEmailOtp, resendOtp } from "@/lib/rh/api";

function VerifyInner() {
  const { go, showToast } = useApp();
  const { mobile } = useViewport();
  const sp = useSearchParams();
  const email = sp.get("email") || "";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const onChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...code]; next[i] = v; setCode(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };
  const filled = code.every((c) => c);

  const submit = async () => {
    setError(null);
    if (!email) { setError("Missing email — please register again."); return; }
    setLoading(true);
    try {
      await verifyEmailOtp(email, code.join(""));
      showToast("Email verified — please sign in");
      go("login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) return;
    try { await resendOtp(email); showToast("A new code has been sent"); }
    catch { showToast("Couldn't resend the code"); }
  };

  return (
    <AuthShell mobile={mobile} title="Verify your email" sub={email ? `Enter the 6-digit code we sent to ${email}.` : "We sent a 6-digit code to your email. Enter it below to continue."}>
      <div style={{ display: "flex", gap: mobile ? 8 : 11, justifyContent: "space-between" }}>
        {code.map((c, i) => (
          <input key={i} ref={(el) => { refs.current[i] = el; }} value={c} inputMode="numeric" maxLength={1}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus(); }}
            style={{ width: mobile ? 46 : 56, height: mobile ? 56 : 64, textAlign: "center", fontFamily: T.serif, fontSize: 28, fontWeight: 600, color: T.ink, background: "#fff", border: "1.5px solid " + (c ? T.clay : T.line), borderRadius: 13, outline: "none" }} />
        ))}
      </div>
      {error && <div style={{ fontFamily: T.sans, fontSize: 13, color: T.red, background: T.redSoft, borderRadius: 10, padding: "10px 14px", marginTop: 16 }}>{error}</div>}
      <div style={{ marginTop: error ? 14 : 24 }}><Button full size="lg" disabled={!filled || loading} onClick={submit}>{loading ? "Verifying…" : "Verify & continue"}</Button></div>
      <p style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, textAlign: "center", marginTop: 20 }}>
        Didn&apos;t get it? <span onClick={resend} style={{ color: T.clay, fontWeight: 600, cursor: "pointer" }}>Resend code</span>
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "center", marginTop: 18, fontFamily: T.sans, fontSize: 12.5, color: T.ink3 }}>
        {I.mail({ width: 15, height: 15 })} Code expires in 10 minutes
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div style={{ minHeight: "100vh", background: T.paper }} />}><VerifyInner /></Suspense>;
}
