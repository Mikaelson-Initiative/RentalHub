"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { T, I } from "@/lib/rh/theme";
import { useApp, useViewport } from "@/components/rh/app";
import { Button } from "@/components/rh/ui";
import { AuthShell } from "@/components/rh/auth-shell";

function VerifyInner() {
  const { go, showToast } = useApp();
  const { mobile } = useViewport();
  const sp = useSearchParams();
  const role = sp.get("role") || "student";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const onChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...code]; next[i] = v; setCode(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };
  const filled = code.every((c) => c);
  const submit = () => { showToast("Email verified — welcome to RentalHub"); go(role === "landlord" ? "landlord" : role); };
  return (
    <AuthShell mobile={mobile} title="Verify your email" sub="We sent a 6-digit code to your email. Enter it below to continue.">
      <div style={{ display: "flex", gap: mobile ? 8 : 11, justifyContent: "space-between" }}>
        {code.map((c, i) => (
          <input key={i} ref={(el) => { refs.current[i] = el; }} value={c} inputMode="numeric" maxLength={1}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus(); }}
            style={{ width: mobile ? 46 : 56, height: mobile ? 56 : 64, textAlign: "center", fontFamily: T.serif, fontSize: 28, fontWeight: 600, color: T.ink, background: "#fff", border: "1.5px solid " + (c ? T.clay : T.line), borderRadius: 13, outline: "none" }} />
        ))}
      </div>
      <div style={{ marginTop: 24 }}><Button full size="lg" disabled={!filled} onClick={submit}>Verify & continue</Button></div>
      <p style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, textAlign: "center", marginTop: 20 }}>
        Didn&apos;t get it? <span onClick={() => showToast("A new code has been sent")} style={{ color: T.clay, fontWeight: 600, cursor: "pointer" }}>Resend code</span>
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "center", marginTop: 18, fontFamily: T.sans, fontSize: 12.5, color: T.ink3 }}>
        {I.mail({ width: 15, height: 15 })} Code sent · expires in 10 minutes · try 123456
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div style={{ minHeight: "100vh", background: T.paper }} />}><VerifyInner /></Suspense>;
}
