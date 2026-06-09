"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { T, naira, I, Logo } from "@/lib/rh/theme";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Card } from "@/components/rh/ui";
import { TaskBar } from "@/components/rh/task-bar";
import { getBooking, mapBooking, type UiBooking } from "@/lib/rh/api";

export default function ReceiptPage() {
  const { go, user } = useApp();
  const { mobile } = useViewport();
  const { id } = useParams<{ id: string }>();
  const [bk, setBk] = useState<UiBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getBooking(id).then((b) => { if (active) setBk(mapBooking(b)); }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading || !bk) {
    return (
      <div style={{ background: T.paper, minHeight: "100vh" }}>
        <TaskBar />
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px", fontFamily: T.sans, color: T.ink2 }}>{loading ? "Loading receipt…" : "Booking not found."}</div>
      </div>
    );
  }

  const total = bk.bid + bk.agencyFee + bk.cautionFee;
  const ref = "RH-" + bk.id.slice(0, 8).toUpperCase();
  const rows: [string, number][] = [["Annual rent", bk.bid], ["Agency fee", bk.agencyFee], ["Caution fee", bk.cautionFee]];

  return (
    <div style={{ background: T.paper, minHeight: "100vh" }}>
      <TaskBar />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: mobile ? "20px" : "32px 24px 56px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2 }}>Official payment receipt</span>
          <Button variant="dark" size="sm" icon={I.doc} onClick={() => window.print()}>Print / Save PDF</Button>
        </div>
        <Card pad={0} style={{ overflow: "hidden" }}>
          <div style={{ background: T.ink, color: T.paper, padding: mobile ? "20px" : "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Logo ink={T.paper} color={T.clay} fontSize={20} size={24} />
            <div style={{ textAlign: "right" }}><div style={{ fontFamily: T.sans, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(244,238,228,.55)" }}>Receipt</div><div style={{ fontFamily: "monospace", fontSize: 13, color: "#fff", marginTop: 2 }}>{ref}</div></div>
          </div>
          <div style={{ background: T.greenSoft, borderBottom: "1px solid " + T.green + "22", padding: "12px 28px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: T.green }} /><span style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.green }}>{bk.status === "PAID" ? "Payment confirmed" : "Payment pending"}</span>
            {bk.paidAt && <span style={{ marginLeft: "auto", fontFamily: T.sans, fontSize: 12.5, color: T.green }}>{new Date(bk.paidAt).toLocaleDateString()}</span>}
          </div>
          <div style={{ padding: mobile ? "22px" : "28px", display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div><div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Tenant</div><div style={{ fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, color: T.ink }}>{user?.name ?? "—"}</div><div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink2 }}>{user?.email ?? ""}</div></div>
              <div><div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Landlord</div><div style={{ fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, color: T.ink }}>{bk.property.landlordName}</div></div>
            </div>
            <div style={{ borderTop: "1px solid " + T.line2, paddingTop: 18 }}>
              <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Property</div>
              <div style={{ fontFamily: T.serif, fontSize: 20, color: T.ink }}>{bk.property.title}</div>
              <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2 }}>{bk.property.area}</div>
            </div>
            {bk.leaseEndDate && (
              <div><div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Lease end</div><div style={{ fontFamily: T.sans, fontSize: 14, color: T.ink, fontWeight: 500 }}>{new Date(bk.leaseEndDate).toLocaleDateString()}</div></div>
            )}
            <div style={{ borderTop: "1px solid " + T.line2, paddingTop: 18 }}>
              <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>Payment breakdown</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {rows.filter((r) => r[1]).map(([t, v]) => <div key={t} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontFamily: T.sans, fontSize: 14, color: T.ink2 }}><span style={{ whiteSpace: "nowrap" }}>{t}</span><span style={{ color: T.ink, fontWeight: 500, whiteSpace: "nowrap" }}>{naira(v)}</span></div>)}
                <div style={{ borderTop: "1px dashed " + T.line, marginTop: 4, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}><span style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 700, color: T.ink, whiteSpace: "nowrap" }}>Total</span><span style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 700, color: T.green, whiteSpace: "nowrap" }}>{naira(total)}</span></div>
              </div>
            </div>
            <div style={{ textAlign: "center", fontFamily: T.sans, fontSize: 11.5, color: T.ink3 }}>This is an official payment receipt from RentalHub · a product of Mikaelson Initiative.</div>
          </div>
        </Card>
        <div style={{ textAlign: "center", marginTop: 18 }}><span onClick={() => go("student")} style={{ fontFamily: T.sans, fontSize: 13.5, color: T.clay, fontWeight: 600, cursor: "pointer" }}>← Back to my bookings</span></div>
      </div>
    </div>
  );
}
