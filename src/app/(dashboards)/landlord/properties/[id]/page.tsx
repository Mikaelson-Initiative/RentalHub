"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { T, naira, I, Photo, Logo } from "@/lib/rh/theme";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Card, Avatar, StatusBadge } from "@/components/rh/ui";
import { getProperty, getLandlordRequests, setBookingStatus, deleteProperty, mapProperty, mapRequest, type UiListing, type UiRequest } from "@/lib/rh/api";

function initialsOf(name: string) {
  return (name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()) || "?";
}

export default function LandlordManagePage() {
  const { go, showToast } = useApp();
  const { mobile } = useViewport();
  const { id } = useParams<{ id: string }>();
  const [l, setL] = useState<(UiListing & { image?: string | null }) | null>(null);
  const [bookings, setBookings] = useState<number>(0);
  const [reqs, setReqs] = useState<UiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled([getProperty(id), getLandlordRequests()]).then(([p, r]) => {
      if (!active) return;
      if (p.status === "fulfilled") { setL(mapProperty(p.value)); setBookings(p.value._count?.bookings ?? 0); }
      else setError("Couldn't load this listing.");
      if (r.status === "fulfilled") setReqs(r.value.map(mapRequest).filter((x) => x.propertyId === id));
      setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  const act = async (rid: string, status: "CONFIRMED" | "CANCELLED") => {
    try { await setBookingStatus(rid, status); setReqs((rs) => rs.map((r) => (r.id === rid ? { ...r, status } : r))); showToast(status === "CONFIRMED" ? "Offer accepted" : "Offer declined"); }
    catch (e) { showToast(e instanceof Error ? e.message : "Action failed"); }
  };
  const remove = async () => {
    try { await deleteProperty(id); showToast("Listing removed"); go("landlord"); }
    catch (e) { showToast(e instanceof Error ? e.message : "Couldn't delete listing"); }
  };

  return (
    <div style={{ background: T.paper, minHeight: "100vh" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(244,238,228,.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid " + T.line2 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={() => go("home")} style={{ cursor: "pointer" }}><Logo size={24} fontSize={20} /></div>
          <span onClick={() => go("landlord")} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: T.sans, fontSize: 13.5, color: T.ink2, cursor: "pointer" }}>{I.arrowLeft({ width: 16, height: 16 })}Back to dashboard</span>
        </div>
      </div>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: mobile ? "20px" : "32px 24px 56px" }}>
        {loading ? (
          <Card pad={40} style={{ textAlign: "center" }}><div style={{ fontFamily: T.sans, color: T.ink2 }}>Loading listing…</div></Card>
        ) : error || !l ? (
          <Card pad={40} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: T.serif, fontSize: 22, color: T.ink }}>Listing not found</div>
            <p style={{ fontFamily: T.sans, fontSize: 14, color: T.ink2, marginTop: 8 }}>{error || "It may have been removed."}</p>
            <div style={{ marginTop: 16, display: "inline-block" }}><Button onClick={() => go("landlord")}>Back to dashboard</Button></div>
          </Card>
        ) : (
          <>
            <Card pad={0} style={{ overflow: "hidden" }}>
              <div style={{ position: "relative", height: mobile ? 180 : 240 }}>
                {l.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.image} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Photo from={l.from} to={l.to} label={l.area} />
                )}
              </div>
              <div style={{ padding: mobile ? 20 : 26 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, display: "flex", alignItems: "center", gap: 5 }}>{I.pin({ width: 13, height: 13 })}{l.area}</div>
                    <h1 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: mobile ? 28 : 38, letterSpacing: "-.02em", color: T.ink, margin: "6px 0 0", lineHeight: 1.05 }}>{l.title}</h1>
                    <div style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 600, color: T.clay, marginTop: 8 }}>{naira(l.price)}<span style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, fontWeight: 400 }}> /year</span></div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button variant="outline" icon={I.eye} onClick={() => go("property", l.id)}>View public</Button>
                    <Button icon={I.doc} onClick={() => go("edit-property", l.id)}>Edit listing</Button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(2,1fr)", gap: 14, marginTop: 22 }}>
                  {([["Tenant requests", String(reqs.length), I.inbox], ["Times booked", String(bookings), I.checkCircle]] as const).map(([t, v, Ic]) => (
                    <div key={t} style={{ background: T.paper, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ width: 40, height: 40, borderRadius: 11, background: "#fff", color: T.clay, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>{Ic({ width: 19, height: 19 })}</span>
                      <div><div style={{ fontFamily: T.serif, fontSize: 24, fontWeight: 600, color: T.ink, lineHeight: 1 }}>{v}</div><div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink2, marginTop: 3 }}>{t}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <h2 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: mobile ? 24 : 30, color: T.ink, letterSpacing: "-.02em", margin: "30px 0 16px" }}>Tenant requests</h2>
            {reqs.length === 0 ? (
              <Card pad={32} style={{ textAlign: "center" }}><div style={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink2 }}>No requests on this listing yet.</div></Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reqs.map((r) => (
                  <Card key={r.id} pad={mobile ? 16 : 18}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <Avatar landlord={{ initials: initialsOf(r.studentName), color: "#3C5A86" }} size={42} />
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ fontFamily: T.sans, fontSize: 15, fontWeight: 700, color: T.ink }}>{r.studentName}</div>
                        <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2 }}>Offer <strong style={{ color: T.green }}>{naira(r.bid)}</strong> · {new Date(r.createdAt).toLocaleDateString()}</div>
                      </div>
                      {r.status === "PENDING"
                        ? <div style={{ display: "flex", gap: 8 }}><Button variant="danger" size="sm" onClick={() => act(r.id, "CANCELLED")}>Decline</Button><Button variant="green" size="sm" onClick={() => act(r.id, "CONFIRMED")}>Accept</Button></div>
                        : <StatusBadge status={r.status} />}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div style={{ marginTop: 26, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="danger" onClick={remove}>Delete listing</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
