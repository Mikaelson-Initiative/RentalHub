"use client";

import { useEffect, useState } from "react";
import { T, naira, I, Photo } from "@/lib/rh/theme";
import { ADMIN_FORECAST } from "@/lib/rh/data";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Card, Avatar, StatusBadge, Pill, Select } from "@/components/rh/ui";
import { DashShell, Stat, EmptyState } from "@/components/rh/dash-shell";
import {
  getAdminSummary, getPendingProperties, getAdminLandlords, getAdminPayouts,
  setPropertyStatus, setLandlordVerification, setPayoutStatus,
  type AdminSummary, type AdminLandlord, type AdminPayout, type ApiProperty,
} from "@/lib/rh/api";

const SCHOOLS = ["BOUESTI — Ikere-Ekiti", "University of Lagos", "Obafemi Awolowo University", "University of Ibadan", "Ahmadu Bello University"];

function initialsOf(name: string) {
  return (name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()) || "?";
}

function AiScore({ score, note, compact }: { score: string; note?: string | null; compact?: boolean }) {
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
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [pending, setPending] = useState<ApiProperty[]>([]);
  const [verifs, setVerifs] = useState<AdminLandlord[]>([]);
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([getAdminSummary(), getPendingProperties(), getAdminLandlords(), getAdminPayouts()]).then((res) => {
      if (!active) return;
      const [s, p, v, po] = res;
      if (s.status === "fulfilled") setSummary(s.value);
      if (p.status === "fulfilled") setPending(p.value.items);
      if (v.status === "fulfilled") setVerifs(v.value);
      if (po.status === "fulfilled") setPayouts(po.value);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const awaitingVerifs = verifs.filter((v) => v.verificationStatus === "UNDER_REVIEW");

  const decideProperty = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await setPropertyStatus(id, status, status === "REJECTED" ? "Rejected from the admin review queue." : undefined);
      setPending((a) => a.filter((x) => x.id !== id));
      showToast(status === "APPROVED" ? "Listing approved & published" : "Listing rejected — landlord notified");
    } catch (e) { showToast(e instanceof Error ? e.message : "Action failed"); }
  };
  const decideVerif = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      await setLandlordVerification(id, action, action === "REJECT" ? "Documents did not meet our verification requirements." : undefined);
      setVerifs((a) => a.map((x) => (x.id === id ? { ...x, verificationStatus: action === "APPROVE" ? "VERIFIED" : "REJECTED" } : x)));
      showToast(action === "APPROVE" ? "Landlord verified" : "Verification rejected");
    } catch (e) { showToast(e instanceof Error ? e.message : "Action failed"); }
  };
  const decidePayout = async (id: string, action: "COMPLETE" | "FAIL") => {
    try {
      await setPayoutStatus(id, action);
      setPayouts((a) => a.filter((x) => x.id !== id));
      showToast(action === "COMPLETE" ? "Payout marked complete — landlord notified" : "Flagged to support");
    } catch (e) { showToast(e instanceof Error ? e.message : "Action failed"); }
  };

  return (
    <DashShell role="admin" tab={tab} setTab={setTab} title="Admin dashboard" subtitle="Review listings, verify landlords and manage payouts"
      badges={{ pending: pending.length || undefined, verifications: awaitingVerifs.length || undefined, payouts: payouts.length || undefined }}
      action={<Select value={school} onChange={(e) => setSchool(e.target.value)} style={{ width: "auto", fontSize: 13, padding: "9px 34px 9px 13px" }}>{SCHOOLS.map((s) => <option key={s}>{s}</option>)}</Select>}>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(6,1fr)", gap: mobile ? 12 : 14, marginBottom: 26 }}>
        <Stat label="Properties" value={summary?.totalProperties ?? "—"} tone="ink" icon={I.building} onClick={() => setTab("properties")} active={tab === "properties"} />
        <Stat label="Pending" value={pending.length} tone="gold" icon={I.clock} onClick={() => setTab("pending")} active={tab === "pending"} />
        <Stat label="Verifications" value={awaitingVerifs.length} tone="blue" icon={I.shield} onClick={() => setTab("verifications")} active={tab === "verifications"} />
        <Stat label="Payouts" value={payouts.length} tone="green" icon={I.wallet} onClick={() => setTab("payouts")} active={tab === "payouts"} />
        <Stat label="Users" value={summary ? summary.totalUsers.toLocaleString() : "—"} tone="ink" icon={I.users} onClick={() => setTab("forecast")} active={tab === "forecast"} />
        <Stat label="Bookings" value={summary?.totalBookings ?? "—"} tone="clay" icon={I.inbox} onClick={() => setTab("forecast")} active={tab === "forecast"} />
      </div>

      {tab === "pending" && (
        loading ? <Card pad={40} style={{ textAlign: "center" }}><div style={{ fontFamily: T.sans, color: T.ink2 }}>Loading the review queue…</div></Card>
        : pending.length === 0 ? <EmptyState icon={I.checkCircle} title="All caught up" sub="No properties are waiting for review." />
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {pending.map((p) => {
              const aiScore = p.aiScamFlag ? "FAIL" : "PASS";
              const media = Array.isArray(p.images) ? p.images.length : 0;
              return (
                <Card key={p.id} pad={mobile ? 16 : 20}>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ width: mobile ? "100%" : 130, height: mobile ? 130 : 96, borderRadius: 12, overflow: "hidden", flex: "0 0 auto" }}><Photo seed={p.id.length} tag={false} /></div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <h3 style={{ margin: 0, fontFamily: T.serif, fontSize: 21, color: T.ink, fontWeight: 500 }}>{p.title}</h3>
                      <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, marginTop: 4 }}>{p.landlord?.name ?? "—"} · {p.location?.name ?? "—"} · <strong style={{ color: T.ink }}>{naira(Number(p.price) || 0)}/yr</strong></div>
                      <div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink3, marginTop: 4 }}>{media} media item{media === 1 ? "" : "s"}{p.createdAt ? ` · submitted ${new Date(p.createdAt).toLocaleDateString()}` : ""}</div>
                      <div style={{ marginTop: 12 }}><AiScore score={aiScore} note={p.aiScamReason ?? "No issues detected by AI pre-screen."} /></div>
                    </div>
                    <div style={{ display: "flex", flexDirection: mobile ? "row" : "column", gap: 8, justifyContent: "center", flex: "0 0 auto", width: mobile ? "100%" : "auto" }}>
                      <Button variant="green" size="sm" full={mobile} onClick={() => decideProperty(p.id, "APPROVED")}>Approve</Button>
                      <Button variant="danger" size="sm" full={mobile} onClick={() => decideProperty(p.id, "REJECTED")}>Reject</Button>
                      <Button variant="ghost" size="sm" full={mobile} onClick={() => go("review", p.id)} iconRight={I.chevRight}>Review</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {tab === "verifications" && (
        loading ? <Card pad={40} style={{ textAlign: "center" }}><div style={{ fontFamily: T.sans, color: T.ink2 }}>Loading verifications…</div></Card>
        : verifs.length === 0 ? <EmptyState icon={I.shield} title="No verifications pending" sub="All landlord submissions have been reviewed." />
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {verifs.map((v) => (
              <Card key={v.id} pad={mobile ? 16 : 20} style={{ opacity: v.verificationStatus === "REJECTED" ? 0.7 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 14, flex: 1, minWidth: 200 }}>
                    <Avatar landlord={{ initials: initialsOf(v.name), color: "#8A5A6B" }} size={46} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span style={{ fontFamily: T.sans, fontSize: 15.5, fontWeight: 700, color: T.ink }}>{v.name}</span><StatusBadge status={v.verificationStatus} /></div>
                      <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2 }}>{v.email}</div>
                      {v.aiPreScreenScore && <div style={{ marginTop: 10 }}><AiScore score={v.aiPreScreenScore} note={v.aiPreScreenNote} /></div>}
                      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                        {([["Gov ID", !!v.governmentIdUrl], ["Selfie", !!v.selfieUrl], ["Ownership", !!v.ownershipProofUrl]] as const).map(([t, ok]) => (
                          <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, background: ok ? T.blueSoft : T.paper, color: ok ? T.blue : T.ink3, border: "1px solid " + (ok ? "transparent" : T.line) }}>
                            {ok ? I.doc({ width: 13, height: 13 }) : I.x({ width: 13, height: 13 })} {t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {v.verificationStatus === "UNDER_REVIEW" && (
                    <div style={{ display: "flex", flexDirection: mobile ? "row" : "column", gap: 8, flex: "0 0 auto", width: mobile ? "100%" : "auto" }}>
                      <Button variant="green" size="sm" full={mobile} onClick={() => decideVerif(v.id, "APPROVE")}>Approve</Button>
                      <Button variant="danger" size="sm" full={mobile} onClick={() => decideVerif(v.id, "REJECT")}>Reject</Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "payouts" && (
        loading ? <Card pad={40} style={{ textAlign: "center" }}><div style={{ fontFamily: T.sans, color: T.ink2 }}>Loading payouts…</div></Card>
        : payouts.length === 0 ? <EmptyState icon={I.wallet} title="No payouts pending" sub="Payouts appear here once students confirm move-in." />
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {payouts.map((po) => {
              const lord = po.property?.landlord;
              return (
                <Card key={po.id} pad={mobile ? 16 : 20}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ fontFamily: T.serif, fontSize: 20, color: T.ink, fontWeight: 500 }}>{po.property?.title ?? "Property"}</div>
                      <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, marginTop: 4 }}>{po.student?.name ?? "Student"} paid · landlord <strong style={{ color: T.ink }}>{lord?.name ?? "—"}</strong></div>
                      <div style={{ display: "flex", gap: 18, marginTop: 12, flexWrap: "wrap" }}>
                        <div><div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textTransform: "uppercase", letterSpacing: ".04em" }}>Release to landlord</div><div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 700, color: T.green, marginTop: 2 }}>{naira(Number(po.amount) || 0)}</div></div>
                        <div><div style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3, textTransform: "uppercase", letterSpacing: ".04em" }}>Bank details</div><div style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink, marginTop: 4 }}>{lord?.bankName ?? "—"}<br />{lord?.bankAccountNumber ?? "—"} · {lord?.bankAccountName ?? "—"}</div></div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center", flex: "0 0 auto", width: mobile ? "100%" : "auto" }}>
                      <Button variant="green" full={mobile} icon={I.check} onClick={() => decidePayout(po.id, "COMPLETE")}>Mark transferred</Button>
                      <Button variant="danger" size="sm" full={mobile} onClick={() => decidePayout(po.id, "FAIL")}>Flag issue</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {tab === "properties" && (
        <Card pad={32} style={{ textAlign: "center" }}><div style={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink2 }}>The full property table isn&apos;t wired yet — use the Pending queue to review and publish listings.</div></Card>
      )}

      {tab === "users" && (
        <Card pad={32} style={{ textAlign: "center" }}><div style={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink2 }}>{summary ? `${summary.totalUsers.toLocaleString()} total users.` : ""} The user management table isn&apos;t wired yet.</div></Card>
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
            <p style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3, marginTop: 10 }}>Demand forecast shown is illustrative.</p>
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
