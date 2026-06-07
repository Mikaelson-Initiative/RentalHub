"use client";

import { useParams } from "next/navigation";
import { T, naira, I, Logo } from "@/lib/rh/theme";
import { bookingById, listingById, landlordById } from "@/lib/rh/data";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Card } from "@/components/rh/ui";
import { TaskBar } from "@/components/rh/task-bar";

export default function ReceiptPage() {
  const { go } = useApp();
  const { mobile } = useViewport();
  const { id } = useParams<{ id: string }>();
  const bk = bookingById(id);
  const l = listingById(bk.listingId)!;
  const lord = landlordById(l.landlord);
  const total = (bk.bid || l.price) + (bk.agencyFee || 0) + (bk.cautionFee || 0);
  const ref = "RH-" + bk.id.toUpperCase() + "-8F3K2A";
  const rows: [string, number][] = [["Annual rent", bk.bid || l.price], ["Agency fee", bk.agencyFee || 0], ["Caution fee", bk.cautionFee || 0]];

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
            <span style={{ width: 8, height: 8, borderRadius: 999, background: T.green }} /><span style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.green }}>Payment confirmed</span>
            <span style={{ marginLeft: "auto", fontFamily: T.sans, fontSize: 12.5, color: T.green }}>{bk.paidAt || "14 May 2026"}</span>
          </div>
          <div style={{ padding: mobile ? "22px" : "28px", display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div><div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Tenant</div><div style={{ fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, color: T.ink }}>Chioma Eze</div><div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink2 }}>chioma.eze@email.com</div></div>
              <div><div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Landlord</div><div style={{ fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, color: T.ink }}>{lord.name}</div><div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink2 }}>{lord.phone}</div></div>
            </div>
            <div style={{ borderTop: "1px solid " + T.line2, paddingTop: 18 }}>
              <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Property</div>
              <div style={{ fontFamily: T.serif, fontSize: 20, color: T.ink }}>{l.title}</div>
              <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2 }}>{l.area}, Ikere-Ekiti</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div><div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Move-in</div><div style={{ fontFamily: T.sans, fontSize: 14, color: T.ink, fontWeight: 500 }}>{bk.moveInDate || "1 June 2026"}</div></div>
              <div><div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>Lease end</div><div style={{ fontFamily: T.sans, fontSize: 14, color: T.ink, fontWeight: 500 }}>{bk.leaseEndDate || "31 May 2027"}</div></div>
            </div>
            <div style={{ borderTop: "1px solid " + T.line2, paddingTop: 18 }}>
              <div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>Payment breakdown</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {rows.filter((r) => r[1]).map(([t, v]) => <div key={t} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontFamily: T.sans, fontSize: 14, color: T.ink2 }}><span style={{ whiteSpace: "nowrap" }}>{t}</span><span style={{ color: T.ink, fontWeight: 500, whiteSpace: "nowrap" }}>{naira(v)}</span></div>)}
                <div style={{ borderTop: "1px dashed " + T.line, marginTop: 4, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}><span style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 700, color: T.ink, whiteSpace: "nowrap" }}>Total paid</span><span style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 700, color: T.green, whiteSpace: "nowrap" }}>{naira(total)}</span></div>
              </div>
            </div>
            <div style={{ background: T.paper2, borderRadius: 12, padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>Reference</div><div style={{ fontFamily: "monospace", fontSize: 12.5, color: T.ink, marginTop: 2 }}>{ref}</div></div>
              <div><div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>Method</div><div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink, marginTop: 2 }}>Card · Paystack</div></div>
            </div>
            <div style={{ textAlign: "center", fontFamily: T.sans, fontSize: 11.5, color: T.ink3 }}>This is an official payment receipt from RentalHub · a product of Mikaelson Initiative.</div>
          </div>
        </Card>
        <div style={{ textAlign: "center", marginTop: 18 }}><span onClick={() => go("student")} style={{ fontFamily: T.sans, fontSize: 13.5, color: T.clay, fontWeight: 600, cursor: "pointer" }}>← Back to my bookings</span></div>
      </div>
    </div>
  );
}
