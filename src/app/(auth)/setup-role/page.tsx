"use client";

import { useState } from "react";
import { T, I, Logo } from "@/lib/rh/theme";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Card } from "@/components/rh/ui";

export default function SetupRolePage() {
  const { go, showToast } = useApp();
  const { mobile } = useViewport();
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div style={{ minHeight: "100vh", background: T.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: mobile ? "32px 20px" : 48 }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div onClick={() => go("home")} style={{ cursor: "pointer", display: "flex", justifyContent: "center", marginBottom: 28 }}><Logo /></div>
        <Card pad={mobile ? 26 : 38}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: mobile ? 28 : 34, letterSpacing: "-.02em", color: T.ink, margin: 0 }}>Welcome, Chioma!</h1>
            <p style={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink2, marginTop: 10 }}>One last step — tell us how you&apos;ll use RentalHub.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14, marginTop: 26 }}>
            {([["student", "I’m a student", "Browse and book verified homes near your school.", I.user],
              ["landlord", "I’m a landlord", "List your property and reach verified student tenants.", I.home]] as const).map(([r, t, d, Ic]) => (
              <div key={r} onClick={() => setSel(r)} style={{ padding: 22, borderRadius: 16, cursor: "pointer", textAlign: "left", background: sel === r ? T.claySoft : "#fff", border: "2px solid " + (sel === r ? T.clay : T.line), transition: "all .12s" }}>
                <div style={{ width: 48, height: 48, borderRadius: 999, background: sel === r ? T.clay : T.paper, color: sel === r ? "#fff" : T.ink2, display: "flex", alignItems: "center", justifyContent: "center" }}>{Ic({ width: 23, height: 23 })}</div>
                <div style={{ fontFamily: T.sans, fontSize: 16, fontWeight: 700, color: T.ink, marginTop: 14 }}>{t}</div>
                <p style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, marginTop: 5, lineHeight: 1.5 }}>{d}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <Button full size="lg" disabled={!sel} iconRight={I.arrow} onClick={() => { if (sel) { showToast("Account ready"); go(sel); } }}>Continue</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
