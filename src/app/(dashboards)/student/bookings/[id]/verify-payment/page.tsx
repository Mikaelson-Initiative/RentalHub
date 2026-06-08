"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { T, naira, I } from "@/lib/rh/theme";
import { bookingById, listingById } from "@/lib/rh/data";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Card } from "@/components/rh/ui";
import { TaskBar } from "@/components/rh/task-bar";

export default function VerifyPaymentPage() {
  const { go } = useApp();
  const { mobile } = useViewport();
  const { id } = useParams<{ id: string }>();
  const bk = bookingById(id);
  const l = listingById(bk.listingId)!;
  const total = (bk.bid || l.price) + (bk.agencyFee || 0) + (bk.cautionFee || 0);
  const [phase, setPhase] = useState<"summary" | "processing" | "success">("summary");
  const rows: [string, number][] = [["Annual rent", bk.bid || l.price], ["Agency fee", bk.agencyFee || 0], ["Caution fee", bk.cautionFee || 0]];

  useEffect(() => {
    if (phase === "processing") { const t = setTimeout(() => setPhase("success"), 2200); return () => clearTimeout(t); }
  }, [phase]);

  return (
    <div style={{ background: T.paper, minHeight: "100vh" }}>
      <TaskBar onBack={() => go("booking", bk.id)} backLabel="Back to booking" />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: mobile ? "24px 20px 48px" : "40px 24px 56px" }}>
        {phase === "summary" && (
          <Card pad={mobile ? 24 : 30}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, color: T.green, fontFamily: T.sans, fontSize: 13, fontWeight: 600 }}>{I.lock({ width: 16, height: 16 })} Secure escrow payment</div>
            <h1 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 30, letterSpacing: "-.02em", color: T.ink, margin: "12px 0 2px" }}>Confirm &amp; pay</h1>
            <p style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, margin: 0 }}>{l.title} · {l.area}</p>
            <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
              {rows.filter((r) => r[1]).map(([t, v]) => (
                <div key={t} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontFamily: T.sans, fontSize: 14, color: T.ink2 }}><span style={{ whiteSpace: "nowrap" }}>{t}</span><span style={{ color: T.ink, fontWeight: 600, whiteSpace: "nowrap" }}>{naira(v)}</span></div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, borderTop: "1px solid " + T.line, paddingTop: 12, marginTop: 4 }}><span style={{ fontFamily: T.sans, fontSize: 14, color: T.ink, whiteSpace: "nowrap" }}>Total due</span><span style={{ fontFamily: T.serif, fontSize: 28, fontWeight: 700, color: T.ink, whiteSpace: "nowrap" }}>{naira(total)}</span></div>
            </div>
            <div style={{ marginTop: 22 }}><Button full size="lg" icon={I.wallet} onClick={() => setPhase("processing")}>Pay with Paystack</Button></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 14, fontFamily: T.sans, fontSize: 12, color: T.ink2 }}>{I.shield({ width: 14, height: 14 })} Held safely until you confirm move-in</div>
          </Card>
        )}
        {phase === "processing" && (
          <Card pad={mobile ? 30 : 40} style={{ textAlign: "center" }}>
            <div style={{ width: 56, height: 56, margin: "0 auto 18px", borderRadius: 999, border: "4px solid " + T.claySoft, borderTopColor: T.clay, animation: "rhspin 0.8s linear infinite" }} />
            <h2 style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 24, color: T.ink, margin: 0 }}>Verifying payment</h2>
            <p style={{ fontFamily: T.sans, fontSize: 14, color: T.ink2, marginTop: 8 }}>Confirming with Paystack — just a moment…</p>
            <style>{"@keyframes rhspin{to{transform:rotate(360deg)}}"}</style>
          </Card>
        )}
        {phase === "success" && (
          <Card pad={mobile ? 28 : 36} style={{ textAlign: "center" }}>
            <div style={{ width: 64, height: 64, margin: "0 auto 18px", borderRadius: 999, background: T.greenSoft, color: T.green, display: "flex", alignItems: "center", justifyContent: "center" }}>{I.checkCircle({ width: 32, height: 32 })}</div>
            <h2 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 30, letterSpacing: "-.02em", color: T.ink, margin: 0 }}>Payment successful!</h2>
            <p style={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink2, lineHeight: 1.55, marginTop: 10 }}>Your home is secured. We&apos;re holding {naira(total)} safely and will release it to your landlord once you confirm move-in.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
              <Button full size="lg" variant="dark" icon={I.doc} onClick={() => go("receipt", bk.id)}>View receipt</Button>
              <Button full variant="outline" onClick={() => go("student")}>Go to my bookings</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
