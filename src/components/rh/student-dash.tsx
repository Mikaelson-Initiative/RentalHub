"use client";

import { useState } from "react";
import { T, naira, I, Photo } from "@/lib/rh/theme";
import { LISTINGS, STUDENT_BOOKINGS, listingById, landlordById, type DemoBooking } from "@/lib/rh/data";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Card, Avatar, StatusBadge, PropertyCard, Input, Field } from "@/components/rh/ui";
import { DashShell, Stat, EmptyState } from "@/components/rh/dash-shell";

function BookingRow({ bk, mobile, onAct }: { bk: DemoBooking; mobile: boolean; onAct: (a: string, b: DemoBooking) => void }) {
  const { go } = useApp();
  const l = listingById(bk.listingId)!;
  const lord = landlordById(l.landlord);
  const total = (bk.bid || l.price) + (bk.agencyFee || 0) + (bk.cautionFee || 0);

  return (
    <Card pad={0} style={{ overflow: "hidden" }}>
      <div style={{ display: mobile ? "block" : "flex" }}>
        <div style={{ position: "relative", width: mobile ? "100%" : 220, height: mobile ? 150 : "auto", flex: "0 0 auto" }}>
          <Photo from={l.from} to={l.to} label={l.area} />
          <span style={{ position: "absolute", top: 12, left: 12 }}><StatusBadge status={bk.status} style={{ background: "rgba(255,255,255,.95)" }} /></span>
        </div>
        <div style={{ flex: 1, padding: mobile ? 18 : 22, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink2, display: "flex", alignItems: "center", gap: 5 }}>{I.pin({ width: 13, height: 13 })}{l.area} · {l.dist} km</div>
              <h3 style={{ margin: "4px 0 0", fontFamily: T.serif, fontSize: 22, color: T.ink, fontWeight: 500 }}>{l.title}</h3>
            </div>
            <div style={{ textAlign: mobile ? "left" : "right" }}>
              <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 600, color: T.ink }}>{naira(bk.bid || l.price)}</div>
              <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink2 }}>your bid · listed {naira(l.price)}</div>
            </div>
          </div>

          {bk.status === "PENDING" && (
            <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 9, background: T.goldSoft, borderRadius: 12, padding: "11px 14px", fontFamily: T.sans, fontSize: 13.5, color: T.ink2 }}>
                {I.clock({ width: 16, height: 16, style: { color: T.gold, flex: "0 0 auto" } })} Waiting for {lord.name.split(" ")[0]} to review your offer.
              </div>
              <Button variant="danger" onClick={() => onAct("cancel", bk)}>Cancel</Button>
            </div>
          )}

          {bk.status === "CONFIRMED" && (
            <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 9, background: T.blueSoft, borderRadius: 12, padding: "11px 14px", fontFamily: T.sans, fontSize: 13.5, color: T.blue }}>
                {I.checkCircle({ width: 16, height: 16, style: { flex: "0 0 auto" } })} Landlord accepted! Payment instructions coming shortly.
              </div>
            </div>
          )}

          {bk.status === "AWAITING_PAYMENT" && (
            <div style={{ marginTop: 16, background: T.claySoft, borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 700, color: T.clayDeep }}>Payment required to secure this home</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: T.sans, fontSize: 12.5, color: T.clay, fontWeight: 600 }}>{I.clock({ width: 14, height: 14 })} 47h remaining</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontFamily: T.sans, fontSize: 13, color: T.ink2 }}>
                <span>Rent {naira(bk.bid || 0)} · Agency {naira(bk.agencyFee || 0)} · Caution {naira(bk.cautionFee || 0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
                <span style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2 }}>Total due</span>
                <span style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 700, color: T.ink }}>{naira(total)}</span>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                {!bk.agreementSigned
                  ? <Button onClick={() => onAct("sign", bk)} icon={I.doc} style={{ flex: 1, minWidth: 180 }}>Review &amp; sign agreement</Button>
                  : <Button variant="dark" onClick={() => go("pay", bk.id)} icon={I.wallet} style={{ flex: 1, minWidth: 180 }}>Pay {naira(total)} securely</Button>}
                <Button variant="danger" onClick={() => onAct("cancel", bk)}>Cancel</Button>
              </div>
            </div>
          )}

          {bk.status === "PAID" && (
            <div style={{ marginTop: 16, background: T.greenSoft, borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                {I.checkCircle({ width: 18, height: 18, style: { color: T.green } })}<span style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 700, color: T.green }}>Paid &amp; secured</span>
                <span style={{ marginLeft: "auto", fontFamily: T.sans, fontSize: 12, color: T.ink2 }}>Lease to {bk.leaseEndDate}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                <div style={{ background: "#fff", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 700, color: T.ink3, textTransform: "uppercase", letterSpacing: ".05em" }}>Landlord contact</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}><Avatar landlord={lord} size={30} /><div><div style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: T.ink }}>{lord.name}</div><div style={{ fontFamily: T.sans, fontSize: 12, color: T.clay }}>{lord.phone}</div></div></div>
                </div>
                <div style={{ background: "#fff", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 700, color: T.ink3, textTransform: "uppercase", letterSpacing: ".05em" }}>Documents</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: T.sans, fontSize: 13, color: T.ink, cursor: "pointer" }} onClick={() => go("receipt", bk.id)}>{I.doc({ width: 15, height: 15, style: { color: T.clay } })} Payment receipt</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: T.sans, fontSize: 13, color: T.ink, cursor: "pointer" }}>{I.doc({ width: 15, height: 15, style: { color: T.clay } })} Signed tenancy agreement</span>
                  </div>
                </div>
              </div>
              {!bk.movedIn ? (
                <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink2, flex: 1, minWidth: 180 }}>Moved in? Confirm to release payment to your landlord.</span>
                  <Button variant="green" icon={I.check} onClick={() => onAct("movein", bk)}>I&apos;ve moved in</Button>
                </div>
              ) : (
                <div style={{ marginTop: 12, fontFamily: T.sans, fontSize: 13, color: T.green, display: "flex", alignItems: "center", gap: 7 }}>{I.checkCircle({ width: 15, height: 15 })} Move-in confirmed · payment released</div>
              )}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, fontFamily: T.sans, fontSize: 12, color: T.ink3 }}>
            <span>Listed by {lord.name}</span>
            <span onClick={() => go("booking", bk.id)} style={{ display: "inline-flex", alignItems: "center", gap: 3, color: T.clay, fontWeight: 600, cursor: "pointer" }}>View details {I.chevRight({ width: 13, height: 13 })}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AgreementModal({ bk, onClose, onSign }: { bk: DemoBooking; onClose: () => void; onSign: (name: string) => void }) {
  const [name, setName] = useState("");
  const [read, setRead] = useState(false);
  const l = listingById(bk.listingId)!;
  const rules = [
    "The tenancy runs for the lease period agreed at booking; rent is paid in full via RentalHub before move-in.",
    "The property is for residential use by the named tenant only — no subletting without written consent.",
    "Keep the property clean and in good condition; report damage, leaks or faults to the landlord promptly.",
    "Observe quiet hours (10pm–7am) and be respectful of neighbours in shared compounds.",
    "No smoking indoors, and no pets without the landlord’s written permission.",
    "Give at least one month’s notice before vacating; the caution fee is refunded after a satisfactory inspection.",
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(33,29,24,.6)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.paper, borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid " + T.line, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div><h2 style={{ margin: 0, fontFamily: T.serif, fontSize: 24, color: T.ink, fontWeight: 500 }}>Tenancy agreement</h2><div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink2, marginTop: 2 }}>{l.title} · {l.area}</div></div>
          <span onClick={onClose} style={{ cursor: "pointer", color: T.ink2 }}>{I.x({ width: 22, height: 22 })}</span>
        </div>
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          <p style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, lineHeight: 1.6, marginTop: 0 }}>This agreement is between the landlord and you, the tenant, facilitated by RentalHub. Please read and accept the key terms:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rules.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 11 }}>
                <span style={{ fontFamily: T.serif, fontSize: 15, fontWeight: 700, color: T.clay, flex: "0 0 auto" }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink, lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: 20, borderTop: "1px solid " + T.line, background: "#fff" }}>
          <label style={{ display: "flex", gap: 9, alignItems: "flex-start", cursor: "pointer", marginBottom: 12 }}>
            <input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)} style={{ accentColor: T.clay, width: 16, height: 16, marginTop: 2 }} />
            <span style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, lineHeight: 1.4 }}>I have read and agree to abide by these tenancy terms.</span>
          </label>
          <Field label="Type your full name to sign"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chioma Eze" /></Field>
          <div style={{ marginTop: 14 }}><Button full size="lg" disabled={!read || name.trim().split(/\s+/).length < 2} onClick={() => onSign(name)}>Sign &amp; agree</Button></div>
        </div>
      </div>
    </div>
  );
}

export function StudentDash({ initial }: { initial?: string }) {
  const { go, showToast, campus } = useApp();
  const { mobile } = useViewport();
  const [tab, setTab] = useState(initial || "bookings");
  const [bookings, setBookings] = useState<DemoBooking[]>(STUDENT_BOOKINGS);
  const [signing, setSigning] = useState<DemoBooking | null>(null);

  const update = (id: string, patch: Partial<DemoBooking>) => setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const onAct = (action: string, bk: DemoBooking) => {
    if (action === "cancel") { update(bk.id, { status: "CANCELLED" }); showToast("Booking cancelled"); }
    else if (action === "sign") setSigning(bk);
    else if (action === "movein") { update(bk.id, { movedIn: true }); showToast("Move-in confirmed · payment released"); }
  };

  const counts = {
    total: bookings.length,
    paid: bookings.filter((b) => b.status === "PAID").length,
    active: bookings.filter((b) => ["CONFIRMED", "AWAITING_PAYMENT"].includes(b.status)).length,
    pending: bookings.filter((b) => b.status === "PENDING").length,
  };
  const visible = bookings.filter((b) => b.status !== "CANCELLED");

  return (
    <DashShell role="student" tab={tab} setTab={(t) => (t === "home" ? go("search") : setTab(t))} title="Student dashboard" subtitle="Browse homes and manage your bookings"
      badges={{ bookings: counts.active || undefined }}
      action={<Button variant="dark" icon={I.search} onClick={() => go("search")} size={mobile ? "sm" : "md"}>{mobile ? "Browse" : "Browse homes"}</Button>}>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap: mobile ? 12 : 18, marginBottom: 26 }}>
        <Stat label="Total bookings" value={counts.total} tone="ink" icon={I.inbox} />
        <Stat label="Paid & secured" value={counts.paid} tone="green" icon={I.checkCircle} />
        <Stat label="Awaiting action" value={counts.active} tone="clay" icon={I.clock} />
        <Stat label="Pending offers" value={counts.pending} tone="gold" icon={I.bolt} />
      </div>

      {tab === "profile" ? (
        <Card pad={mobile ? 22 : 30} style={{ maxWidth: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Avatar landlord={{ initials: "CE", color: "#3C5A86" }} size={64} />
            <div><div style={{ fontFamily: T.serif, fontSize: 24, color: T.ink }}>Chioma Eze</div><div style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2 }}>{campus.short} · 300 Level</div></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 24 }}>
            <Field label="Full name"><Input defaultValue="Chioma Eze" /></Field>
            <Field label="Email"><Input defaultValue="chioma.eze@email.com" /></Field>
            <Field label="Phone"><Input defaultValue="0807 555 0190" /></Field>
            <div><Button onClick={() => showToast("Profile saved")}>Save changes</Button></div>
          </div>
        </Card>
      ) : tab === "saved" ? (
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill,minmax(248px,1fr))", gap: 20 }}>
          {LISTINGS.filter((l) => l.featured).slice(0, 3).map((l) => <PropertyCard key={l.id} l={l} mobile={mobile} onClick={() => go("property", l.id)} />)}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState icon={I.inbox} title="No bookings yet" sub="Browse verified homes near your campus and place your first booking." action={<Button onClick={() => go("search")} iconRight={I.arrow}>Browse homes</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {visible.map((bk) => <BookingRow key={bk.id} bk={bk} mobile={mobile} onAct={onAct} />)}
        </div>
      )}

      {signing && <AgreementModal bk={signing} onClose={() => setSigning(null)} onSign={(name) => { update(signing.id, { agreementSigned: true, agreementName: name }); setSigning(null); showToast("Agreement signed — you can now pay"); }} />}
    </DashShell>
  );
}
