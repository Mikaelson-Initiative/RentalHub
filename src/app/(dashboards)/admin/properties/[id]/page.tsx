"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { T, naira, I, Photo, Logo, amenityIcon } from "@/lib/rh/theme";
import { pendingById } from "@/lib/rh/data";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Card, StatusBadge, Textarea } from "@/components/rh/ui";

export default function AdminPropertyReviewPage() {
  const { go, showToast } = useApp();
  const { mobile } = useViewport();
  const { id } = useParams<{ id: string }>();
  const p = pendingById(id);
  const [reason, setReason] = useState("");
  const amenities = ["Borehole", "Prepaid meter", "Tiled floors", "Gated compound", "Parking space"];
  const desc = `A ${p.title.toLowerCase()} in ${p.area}, submitted for review. Newly finished and marketed to students near campus. Landlord reports steady water and power backup.`;
  const aiTone = p.aiScore === "PASS" ? "green" : p.aiScore === "FAIL" ? "red" : "gold";
  const facts: [string, string][] = [["Location", p.area], ["Price", naira(p.price) + "/yr"], ["Distance to campus", "0.8 km"], ["Existing bookings", "0"]];
  const meta: [string, string][] = [["Landlord", p.landlord], ["Landlord status", "Under review"], ["Media items", String(p.media)], ["Submitted", p.submitted]];

  return (
    <div style={{ background: T.paper, minHeight: "100vh" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(244,238,228,.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid " + T.line2 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={() => go("home")} style={{ cursor: "pointer" }}><Logo size={24} fontSize={20} /></div>
          <span onClick={() => go("admin")} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: T.sans, fontSize: 13.5, color: T.ink2, cursor: "pointer" }}>{I.arrowLeft({ width: 16, height: 16 })}Back to admin queue</span>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: mobile ? "20px" : "32px 24px 56px" }}>
        <Card pad={mobile ? 22 : 30}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
            <h1 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: mobile ? 28 : 38, letterSpacing: "-.02em", color: T.ink, margin: 0, lineHeight: 1.05 }}>{p.title}</h1>
            <StatusBadge status="PENDING" />
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 18, padding: 16, borderRadius: 14, background: aiTone === "green" ? T.greenSoft : aiTone === "red" ? T.redSoft : T.goldSoft }}>
            <span style={{ color: aiTone === "green" ? T.green : aiTone === "red" ? T.red : T.gold, flex: "0 0 auto", marginTop: 1 }}>{I.sparkle({ width: 20, height: 20 })}</span>
            <div><div style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 700, color: aiTone === "green" ? T.green : aiTone === "red" ? T.red : T.gold }}>AI pre-screen: {p.aiScore}</div><div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, marginTop: 3, lineHeight: 1.5 }}>{p.aiNote}</div></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? 16 : 28, marginTop: 22 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {facts.map(([k, v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontFamily: T.sans, fontSize: 14 }}><span style={{ color: T.ink2 }}>{k}</span><span style={{ color: T.ink, fontWeight: 600, whiteSpace: "nowrap", textAlign: "right" }}>{v}</span></div>)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {meta.map(([k, v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontFamily: T.sans, fontSize: 14 }}><span style={{ color: T.ink2 }}>{k}</span><span style={{ color: T.ink, fontWeight: 600, whiteSpace: "nowrap", textAlign: "right" }}>{v}</span></div>)}
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <h2 style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 20, color: T.ink, margin: "0 0 8px" }}>Description</h2>
            <p style={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink2, lineHeight: 1.6, margin: 0 }}>{desc}</p>
          </div>

          <div style={{ marginTop: 22 }}>
            <h2 style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 20, color: T.ink, margin: "0 0 12px" }}>Amenities</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {amenities.map((a) => <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: T.sans, fontSize: 12.5, color: T.ink2, background: T.paper, padding: "6px 11px", borderRadius: 999 }}>{amenityIcon(a, { width: 13, height: 13 })}{a}</span>)}
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <h2 style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 20, color: T.ink, margin: "0 0 12px" }}>Uploaded media <span style={{ fontFamily: T.sans, fontSize: 13, color: T.ink3, fontWeight: 400 }}>({p.media} items)</span></h2>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10 }}>
              {Array.from({ length: Math.min(p.media, 8) }).map((_, i) => <div key={i} style={{ aspectRatio: "4/3", borderRadius: 12, overflow: "hidden" }}><Photo seed={i + p.id.length} tag={false} /></div>)}
            </div>
          </div>

          <div style={{ marginTop: 26, borderTop: "1px solid " + T.line, paddingTop: 22 }}>
            <h2 style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 20, color: T.ink, margin: "0 0 12px" }}>Review decision</h2>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required when rejecting) — shared with the landlord" style={{ minHeight: 72 }} />
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Button variant="danger" icon={I.x} onClick={() => { if (!reason.trim()) { showToast("Add a reason before rejecting"); return; } showToast("Listing rejected — landlord notified"); go("admin"); }}>Reject listing</Button>
              <Button variant="green" icon={I.check} onClick={() => { showToast("Listing approved & published"); go("admin"); }}>Approve listing</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
