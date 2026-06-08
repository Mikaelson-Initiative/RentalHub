"use client";

import { useState } from "react";
import { T, naira, I, Photo } from "@/lib/rh/theme";
import { ADMIN_SUMMARY, ADMIN_PENDING, ADMIN_VERIFICATIONS, ADMIN_PAYOUTS, ADMIN_FORECAST, LISTINGS, listingById, landlordById } from "@/lib/rh/data";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Card, Avatar, StatusBadge, Pill, Select } from "@/components/rh/ui";
import { DashShell, Stat, EmptyState } from "@/components/rh/dash-shell";

const SCHOOLS = ["BOUESTI — Ikere-Ekiti", "University of Lagos", "Obafemi Awolowo University", "University of Ibadan", "Ahmadu Bello University"];

function AiScore({ score, note, compact }: { score: string; note?: string; compact?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: compact ? "center" : "flex-start", gap: 9 }}>
      <Pill tone={score === "PASS" ? "green" : score === "FAIL" ? "red" : "gold"} icon={I.sparkle}>AI: {score}</Pill>
      {note && !compact && <span style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink2, fontStyle: "italic", lineHeight: 1.4 }}>&quot;{note}&quot;</span>}
    </div>
  );
}

export function AdminDash() {
  const { showToast, go } = useApp();
  const { mobile } = useViewport();
  const [tab, setTab] = useState("pending");
  const [school, setSchool] = useState(SCHOOLS[0]);
  const [pending, setPending] = useState(ADMIN_PENDING);
  const [verifs, setVerifs] = useState(ADMIN_VERIFICATIONS);
  const [payouts, setPayouts] = useState(ADMIN_PAYOUTS);

  const awaitingVerifs = verifs.filter((v) => v.status === "UNDER_REVIEW");

  return (
    <DashShell role="admin" tab={tab} setTab={setTab} title="Admin dashboard" subtitle="Review listings, verify landlords and manage payouts"
      badges={{ pending: pending.length || undefined, verifications: awaitingVerifs.length || undefined, payouts: payouts.length || undefined }}
      action={<Select value={school} onChange={(e) => setSchool(e.target.value)} style={{ width: "auto", fontSize: 13, padding: "9px 34px 9px 13px" }}>{SCHOOLS.map((s) => <option key={s}>{s}</option>)}</Select>}>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(6,1fr)", gap: mobile ? 12 : 14, marginBottom: 26 }}>
        <Stat label="Properties" value={ADMIN_SUMMARY.totalProperties} tone="ink" icon={I.building} onClick={() => setTab("properties")} active={tab === "properties"} />
        <Stat label="Pending" value={pending.length} tone="gold" icon={I.clock} onClick={() => setTab("pending")} active={tab === "pending"} />
        <Stat label="Verifications" value={awaitingVerifs.length} tone="blue" icon={I.shield} onClick={() => setTab("verifications")} active={tab === "verifications"} />
        <Stat label="Payouts" value={payouts.length} tone="green" icon={I.wallet} onClick={() => setTab("payouts")} active={tab === "payouts"} />
        <Stat label="Users" value={ADMIN_SUMMARY.totalUsers.toLocaleString()} tone="ink" icon={I.users} onClick={() => setTab("users")} active={tab === "users"} />
        <Stat label="Bookings" value={ADMIN_SUMMARY.totalBookings} tone="clay" icon={I.inbox} onClick={() => setTab("forecast")} active={tab === "forecast"} />
      </div>

      {tab === "pending" && (
        pending.length === 0 ? <EmptyState icon={I.checkCircle} title="All caught up" sub="No properties are waiting for review." />
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {pending.map((p) => (
              <Card key={p.id} pad={mobile ? 16 : 20}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ width: mobile ? "100%" : 130, height: mobile ? 130 : 96, borderRadius: 12, overflow: "hidden", flex: "0 0 auto" }}><Photo seed={p.id.length} tag={false} /></div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <h3 style={{ margin: 0, fontFamily: T.serif, fontSize: 21, color: T.ink, fontWeight: 500 }}>{p.title}</h3>
                    <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, marginTop: 4 }}>{p.landlord} · {p.area} · <strong style={{ color: T.ink }}>{naira(p.price)}/yr</strong></div>
                    <div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 4 }}>{p.media} media items · submitted {p.submitted}</div>
                    <div style={{ marginTop: 12 }}><AiScore score={p.aiScore} note={p.aiNote} /></div>
                  </div>
                  <div style={{ display: "flex", flexDirection: mobile ? "row" : "column", gap: 8, justifyContent: "center", flex: "0 0 auto", width: mobile ? "100%" : "auto" }}>
                    <Button variant="green" size="sm" full={mobile} onClick={() => { setPending((a) => a.filter((x) => x.id !== p.id)); showToast("Listing approved & published"); }}>Approve</Button>
                    <Button variant="danger" size="sm" full={mobile} onClick={() => { setPending((a) => a.filter((x) => x.id !== p.id)); showToast("Listing rejected — landlord notified"); }}>Reject</Button>
                    <Button variant="ghost" size="sm" full={mobile} onClick={() => go("review", p.id)} iconRight={I.chevRight}>Review</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "properties" && (
        <Card pad={0} style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead><tr style={{ background: T.paper2 }}>
                {["Property", "Landlord", "Area", "Price", "Status", ""].map((h) => <th key={h} style={{ textAlign: "left", padding: "13px 16px", fontFamily: T.sans, fontSize: 12, fontWeight: 700, color: T.ink2, textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {LISTINGS.slice(0, 8).map((l, i) => (
                  <tr key={l.id} style={{ borderTop: "1px solid " + T.line2 }}>
                    <td style={{ padding: "13px 16px", fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.ink }}>{l.title}</td>
                    <td style={{ padding: "13px 16px", fontFamily: T.sans, fontSize: 13.5, color: T.ink2 }}>{landlordById(l.landlord).name}</td>
                    <td style={{ padding: "13px 16px", fontFamily: T.sans, fontSize: 13.5, color: T.ink2 }}>{l.area}</td>
                    <td style={{ padding: "13px 16px", fontFamily: T.sans, fontSize: 13.5, color: T.ink, fontWeight: 600 }}>{naira(l.price)}</td>
                    <td style={{ padding: "13px 16px" }}><StatusBadge status={i === 6 ? "PENDING" : "APPROVED"} /></td>
                    <td style={{ padding: "13px 16px" }}><span style={{ fontFamily: T.sans, fontSize: 13, color: T.clay, fontWeight: 600, cursor: "pointer" }}>Review</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "verifications" && (
        awaitingVerifs.length === 0 ? <EmptyState icon={I.shield} title="No verifications pending" sub="All landlord submissions have been reviewed." />
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {verifs.map((v) => (
              <Card key={v.id} pad={mobile ? 16 : 20} style={{ opacity: v.status === "REJECTED" ? 0.7 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 14, flex: 1, minWidth: 200 }}>
                    <Avatar landlord={{ initials: v.name.split(" ").map((w) => w[0]).join(""), color: "#8A5A6B" }} size={46} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span style={{ fontFamily: T.sans, fontSize: 15.5, fontWeight: 700, color: T.ink }}>{v.name}</span><StatusBadge status={v.status} /></div>
                      <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2 }}>{v.email} · submitted {v.submitted}</div>
                      <div style={{ marginTop: 10 }}><AiScore score={v.aiScore} note={v.aiNote} /></div>
                      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                        {([["Gov ID", v.docs.id], ["Selfie", v.docs.selfie], ["Ownership", v.docs.ownership]] as const).map(([t, ok]) => (
                          <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, cursor: ok ? "pointer" : "default", background: ok ? T.blueSoft : T.paper, color: ok ? T.blue : T.ink3, border: "1px solid " + (ok ? "transparent" : T.line) }}>
                            {ok ? I.doc({ width: 13, height: 13 }) : I.x({ width: 13, height: 13 })} {t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {v.status === "UNDER_REVIEW" && (
                    <div style={{ display: "flex", flexDirection: mobile ? "row" : "column", gap: 8, flex: "0 0 auto", width: mobile ? "100%" : "auto" }}>
                      <Button variant="green" size="sm" full={mobile} onClick={() => { setVerifs((a) => a.map((x) => (x.id === v.id ? { ...x, status: "VERIFIED" } : x))); showToast(v.name + " verified"); }}>Approve</Button>
                      <Button variant="danger" size="sm" full={mobile} onClick={() => { setVerifs((a) => a.map((x) => (x.id === v.id ? { ...x, status: "REJECTED" } : x))); showToast("Verification rejected"); }}>Reject</Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "payouts" && (
        payouts.length === 0 ? <EmptyState icon={I.wallet} title="No payouts pending" sub="Payouts appear here once students confirm move-in." />
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {payouts.map((po) => { const l = listingById(po.listingId)!; return (
              <Card key={po.id} pad={mobile ? 16 : 20}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span style={{ fontFamily: T.serif, fontSize: 20, color: T.ink, fontWeight: 500 }}>{l.title}</span><Pill tone="green" icon={I.checkCircle}>Moved in {po.movedIn}</Pill></div>
                    <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, marginTop: 4 }}>{po.student} paid · landlord <strong style={{ color: T.ink }}>{po.landlord}</strong></div>
                    <div style={{ display: "flex", gap: 18, marginTop: 12, flexWrap: "wrap" }}>
                      <div><div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textTransform: "uppercase", letterSpacing: ".04em" }}>Release to landlord</div><div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 700, color: T.green, marginTop: 2 }}>{naira(po.amount)}</div></div>
                      <div><div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textTransform: "uppercase", letterSpacing: ".04em" }}>Bank details</div><div style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink, marginTop: 4 }}>{po.bank}<br />{po.acct} · {po.acctName}</div></div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center", flex: "0 0 auto", width: mobile ? "100%" : "auto" }}>
                    <Button variant="green" full={mobile} icon={I.check} onClick={() => { setPayouts((a) => a.filter((x) => x.id !== po.id)); showToast("Payout marked complete — landlord notified"); }}>Mark transferred</Button>
                    <Button variant="danger" size="sm" full={mobile} onClick={() => { setPayouts((a) => a.filter((x) => x.id !== po.id)); showToast("Flagged to support"); }}>Flag issue</Button>
                  </div>
                </div>
              </Card>
            ); })}
          </div>
        )
      )}

      {tab === "users" && (
        <Card pad={0} style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
              <thead><tr style={{ background: T.paper2 }}>{["Name", "Role", "Verification", "Listings", "Bookings", ""].map((h) => <th key={h} style={{ textAlign: "left", padding: "13px 16px", fontFamily: T.sans, fontSize: 12, fontWeight: 700, color: T.ink2, textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</th>)}</tr></thead>
              <tbody>
                {([["Chioma Eze", "STUDENT", "VERIFIED", 0, 4], ["Adebayo Ogunleye", "LANDLORD", "VERIFIED", 3, 0], ["Funke Akinwale", "LANDLORD", "VERIFIED", 2, 0], ["Yusuf Bello", "LANDLORD", "UNDER_REVIEW", 2, 0], ["Tunde Bakare", "STUDENT", "VERIFIED", 0, 1], ["Musa Danladi", "LANDLORD", "REJECTED", 0, 0]] as const).map(([n, role, vs, ls, bk], i) => (
                  <tr key={i} style={{ borderTop: "1px solid " + T.line2 }}>
                    <td style={{ padding: "13px 16px" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar landlord={{ initials: n.split(" ").map((w) => w[0]).join(""), color: ["#3C5A86", "#2F5D4F", "#C2622E", "#6B7B4A", "#8A5A6B", "#A8451B"][i] }} size={30} /><span style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.ink }}>{n}</span></div></td>
                    <td style={{ padding: "13px 16px" }}><Pill tone={role === "LANDLORD" ? "clay" : role === "STUDENT" ? "blue" : "dark"}>{role}</Pill></td>
                    <td style={{ padding: "13px 16px" }}><StatusBadge status={vs} /></td>
                    <td style={{ padding: "13px 16px", fontFamily: T.sans, fontSize: 13.5, color: T.ink2 }}>{ls}</td>
                    <td style={{ padding: "13px 16px", fontFamily: T.sans, fontSize: 13.5, color: T.ink2 }}>{bk}</td>
                    <td style={{ padding: "13px 16px" }}><span style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, fontWeight: 600, cursor: "pointer" }}>Manage</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "forecast" && (
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.3fr 1fr", gap: 18 }}>
          <Card pad={mobile ? 20 : 26}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}><Pill tone="clay" icon={I.sparkle}>AI forecast</Pill><span style={{ fontFamily: T.serif, fontSize: 22, color: T.green, whiteSpace: "nowrap" }}>{ADMIN_FORECAST.verdict}</span></div>
            <p style={{ fontFamily: T.sans, fontSize: 14, color: T.ink2, lineHeight: 1.6, marginTop: 10 }}>{ADMIN_FORECAST.note}</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: mobile ? 10 : 16, height: 160, marginTop: 22, paddingTop: 10 }}>
              {ADMIN_FORECAST.months.map((m, i) => { const max = Math.max(...ADMIN_FORECAST.months.map((x) => x.v)); return (
                <div key={m.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 700, color: T.ink2 }}>{m.v}</div>
                  <div style={{ width: "100%", maxWidth: 38, height: (m.v / max) * 120, background: i === ADMIN_FORECAST.months.length - 1 ? T.clay : T.paper3, borderRadius: "8px 8px 0 0" }} />
                  <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3 }}>{m.m}</div>
                </div>
              ); })}
            </div>
          </Card>
          <Card pad={mobile ? 20 : 26}>
            <div style={{ fontFamily: T.serif, fontSize: 20, color: T.ink, marginBottom: 16 }}>Hottest areas</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {ADMIN_FORECAST.hotAreas.map((a) => (
                <div key={a.area}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: T.sans, fontSize: 13, color: T.ink, marginBottom: 5 }}><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.area}</span><span style={{ color: T.ink2, flex: "0 0 auto" }}>{a.demand}%</span></div>
                  <div style={{ height: 8, background: T.paper2, borderRadius: 8, overflow: "hidden" }}><div style={{ width: a.demand + "%", height: "100%", background: T.clay, borderRadius: 8 }} /></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </DashShell>
  );
}
