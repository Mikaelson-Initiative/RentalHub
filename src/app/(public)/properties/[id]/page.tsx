"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { T, naira, I, Photo, amenityIcon } from "@/lib/rh/theme";
import { useApp, useViewport } from "@/components/rh/app";
import { Pill, Button, Card, Avatar, PropertyCard, PublicNav, Footer } from "@/components/rh/ui";
import { apiGet, mapProperty, type ApiProperty, type ApiListResponse, type UiListing } from "@/lib/rh/api";

type DetailListing = UiListing & { images: string[] };

function initialsOf(name: string) {
  return (name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()) || "?";
}

function Gallery({ l, mobile }: { l: DetailListing; mobile: boolean }) {
  const [active, setActive] = useState(0);
  const tones: [string, string][] = [[l.from, l.to], ["#c8bca6", "#7d7158"], ["#d3bd98", "#897046"], ["#bcae9a", "#6f6450"]];
  const labels = ["Front view", "Living area", "Bedroom", "Compound"];
  return (
    <div>
      <div style={{ position: "relative", height: mobile ? 240 : 420, borderRadius: 20, overflow: "hidden" }}>
        {l.images[active] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.images[active]} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Photo from={tones[active][0]} to={tones[active][1]} label={labels[active]} />
        )}
        <span style={{ position: "absolute", top: 16, left: 16 }}><Pill tone="green" icon={I.shield} style={{ background: "rgba(255,255,255,.95)", fontSize: 12.5, padding: "7px 13px" }}>Admin-verified listing</Pill></span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: mobile ? 8 : 12, marginTop: 12 }}>
        {tones.map((t, i) => (
          <div key={i} onClick={() => setActive(i)} style={{ position: "relative", height: mobile ? 56 : 84, borderRadius: 12, overflow: "hidden", cursor: "pointer", outline: active === i ? `2.5px solid ${T.clay}` : "2.5px solid transparent", outlineOffset: 2 }}>
            {l.images[i] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.images[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Photo from={t[0]} to={t[1]} tag={false} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingCard({ l, mobile }: { l: DetailListing; mobile: boolean }) {
  const { go, role, showToast } = useApp();
  const [bid, setBid] = useState(l.price);
  const [placed, setPlaced] = useState(false);
  const firstName = l.landlordName.split(" ")[0];

  const place = () => {
    if (role === "guest") { go("login"); return; }
    if (role !== "student") { showToast("Switch to a student account to book"); return; }
    setPlaced(true);
    showToast("Booking request sent to " + firstName);
  };

  return (
    <Card pad={mobile ? 20 : 24} style={{ boxShadow: "0 24px 50px -34px rgba(33,29,24,.5)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <span style={{ fontFamily: T.serif, fontSize: mobile ? 30 : 36, fontWeight: 600, color: T.ink }}>{naira(l.price)}</span>
          <span style={{ fontFamily: T.sans, fontSize: 14, color: T.ink2 }}> /year</span>
        </div>
        <Pill tone="green">{l.vacant} {l.vacant === 1 ? "unit" : "units"} left</Pill>
      </div>

      {!placed ? (
        <>
          <div style={{ marginTop: 18, padding: 14, background: T.paper, borderRadius: 12, border: "1px solid " + T.line2 }}>
            <div style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: T.ink2, marginBottom: 8 }}>Make an offer (your bid / year)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid " + T.line, borderRadius: 11, padding: "4px 6px 4px 14px" }}>
              <span style={{ fontFamily: T.serif, fontSize: 20, color: T.ink2 }}>₦</span>
              <input type="number" value={bid} onChange={(e) => setBid(+e.target.value)} style={{ flex: 1, border: "none", outline: "none", fontFamily: T.sans, fontSize: 18, fontWeight: 600, color: T.ink, width: "100%", background: "transparent" }} />
            </div>
            <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3, marginTop: 8 }}>Offer the asking price or bid your budget. The landlord reviews all offers.</div>
          </div>
          <div style={{ marginTop: 16 }}><Button full size="lg" onClick={place} iconRight={I.arrow}>Request to book</Button></div>
        </>
      ) : (
        <div style={{ marginTop: 18, padding: 16, background: T.goldSoft, borderRadius: 14, border: "1px solid " + T.gold + "33" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{I.clock({ width: 18, height: 18, style: { color: T.gold } })}<span style={{ fontFamily: T.sans, fontWeight: 700, color: T.gold, fontSize: 14 }}>Request sent — pending landlord</span></div>
          <p style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, marginTop: 8, lineHeight: 1.5 }}>{firstName} usually responds within a day. Track it in your bookings.</p>
          <div style={{ marginTop: 12 }}><Button full variant="soft" onClick={() => go("student")}>Go to my bookings</Button></div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, justifyContent: "center", fontFamily: T.sans, fontSize: 12.5, color: T.ink2 }}>
        {I.lock({ width: 14, height: 14 })} Your payment is held safely until you move in
      </div>
    </Card>
  );
}

export default function PropertyDetailPage() {
  const { go } = useApp();
  const { mobile } = useViewport();
  const { id } = useParams<{ id: string }>();
  const [l, setL] = useState<DetailListing | null>(null);
  const [similar, setSimilar] = useState<UiListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiGet<ApiProperty>(`/api/properties/${id}`)
      .then((p) => { if (active) setL(mapProperty(p)); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Failed to load"); })
      .finally(() => { if (active) setLoading(false); });
    apiGet<ApiListResponse>("/api/properties?pageSize=12")
      .then((r) => { if (active) setSimilar(r.items.map(mapProperty)); })
      .catch(() => {});
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: T.paper, minHeight: "100vh" }}>
        <PublicNav />
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "60px 40px", fontFamily: T.sans, color: T.ink2 }}>Loading home…</div>
        <Footer />
      </div>
    );
  }
  if (error || !l) {
    return (
      <div style={{ background: T.paper, minHeight: "100vh" }}>
        <PublicNav />
        <div style={{ maxWidth: 720, margin: "0 auto", padding: mobile ? "40px 20px" : "64px 40px" }}>
          <Card pad={40} style={{ textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: T.redSoft, color: T.red, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>{I.shieldAlert({ width: 26, height: 26 })}</div>
            <div style={{ fontFamily: T.serif, fontSize: 24, color: T.ink }}>Home not found</div>
            <p style={{ fontFamily: T.sans, fontSize: 14, color: T.ink2, marginTop: 8 }}>{error || "This listing may have been removed."}</p>
            <div style={{ marginTop: 18, display: "inline-block" }}><Button onClick={() => go("search")}>Back to search</Button></div>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const sim = similar.filter((x) => x.area === l.area && x.id !== l.id).slice(0, mobile ? 2 : 3);
  const facts: [(p?: Record<string, unknown>) => React.ReactElement, string][] = [
    [I.bed, l.type],
    ...(l.dist ? ([[I.pin, `${l.dist} km to gate`]] as [(p?: Record<string, unknown>) => React.ReactElement, string][]) : []),
    [I.user, "Any gender"],
  ];

  return (
    <div style={{ background: T.paper, minHeight: "100vh" }}>
      <PublicNav />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: mobile ? "16px 20px 40px" : "24px 40px 60px" }}>
        <div onClick={() => go("search")} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: T.sans, fontSize: 13.5, color: T.ink2, cursor: "pointer", marginBottom: 18 }}>
          {I.arrowLeft({ width: 16, height: 16 })} Back to search
        </div>

        <div style={{ display: mobile ? "block" : "grid", gridTemplateColumns: "1.7fr 1fr", gap: 40, alignItems: "start" }}>
          <div>
            <Gallery l={l} mobile={mobile} />

            <div style={{ marginTop: 26 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.ink2, fontFamily: T.sans, fontSize: 13.5 }}>
                {I.pin({ width: 15, height: 15 })}{l.area}
              </div>
              <h1 style={{ margin: "8px 0 0", fontFamily: T.serif, fontWeight: 400, fontSize: mobile ? 32 : 46, letterSpacing: "-.02em", color: T.ink, lineHeight: 1.05 }}>{l.title}</h1>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: mobile ? 10 : 14, marginTop: 20 }}>
              {facts.map(([Ic, t], i) => (
                <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid " + T.line, borderRadius: 12, padding: "10px 14px", fontFamily: T.sans, fontSize: 13.5, color: T.ink }}>
                  {Ic({ width: 16, height: 16, style: { color: T.clay } })}{t}
                </div>
              ))}
            </div>

            {mobile && <div style={{ margin: "24px 0" }}><BookingCard l={l} mobile={mobile} /></div>}

            <div style={{ marginTop: 28 }}>
              <h2 style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 24, color: T.ink, margin: "0 0 12px" }}>About this home</h2>
              <p style={{ fontFamily: T.sans, fontSize: 15.5, color: T.ink2, lineHeight: 1.65, margin: 0 }}>{l.desc}</p>
            </div>

            {l.amenities.length > 0 && (
              <div style={{ marginTop: 30 }}>
                <h2 style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 24, color: T.ink, margin: "0 0 16px" }}>What this place offers</h2>
                <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 14 }}>
                  {l.amenities.map((a) => (
                    <div key={a} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: T.sans, fontSize: 14.5, color: T.ink }}>
                      <span style={{ width: 36, height: 36, borderRadius: 10, background: T.paper, color: T.clay, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>{amenityIcon(a, { width: 17, height: 17 })}</span>{a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 30 }}>
              <Card pad={mobile ? 18 : 22} style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <Avatar landlord={{ initials: initialsOf(l.landlordName), color: "#2F5D4F" }} size={54} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: T.serif, fontSize: 20, color: T.ink }}>{l.landlordName}</span>
                    {l.landlordVerified && <Pill tone="green" icon={I.shield}>Verified landlord</Pill>}
                  </div>
                  <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, marginTop: 4 }}>Usually responds within a day</div>
                </div>
                <Button variant="outline" icon={I.phone}>Contact</Button>
              </Card>
            </div>
          </div>

          {!mobile && <div style={{ position: "sticky", top: 92 }}><BookingCard l={l} mobile={mobile} /></div>}
        </div>

        {sim.length > 0 && (
          <div style={{ marginTop: mobile ? 40 : 60 }}>
            <h2 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: mobile ? 26 : 34, color: T.ink, letterSpacing: "-.02em", margin: "0 0 20px" }}>More homes in {l.area}</h2>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : `repeat(${sim.length},1fr)`, gap: 20 }}>
              {sim.map((s) => <PropertyCard key={s.id} l={s} mobile={mobile} onClick={() => go("property", s.id)} />)}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
