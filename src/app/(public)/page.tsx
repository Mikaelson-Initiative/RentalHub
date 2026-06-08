"use client";

import { T, naira, I, Photo } from "@/lib/rh/theme";
import { LISTINGS, AREAS } from "@/lib/rh/data";
import { useApp, useViewport } from "@/components/rh/app";
import { Pill, Button, Card, SectionHead, PropertyCard, PublicNav, Footer } from "@/components/rh/ui";
import { TourVideo } from "@/components/rh/tour-video";

function HeroSearch({ mobile }: { mobile: boolean }) {
  const { go } = useApp();
  return (
    <div style={{ background: "#fff", border: "1px solid " + T.line, borderRadius: mobile ? 18 : 999, padding: mobile ? 12 : 8, display: "flex", flexDirection: mobile ? "column" : "row", gap: mobile ? 10 : 6, alignItems: "center", boxShadow: "0 18px 40px -30px rgba(33,29,24,.6)", maxWidth: mobile ? "100%" : 460 }}>
      <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "center", gap: 9, padding: mobile ? "8px" : "4px 16px" }}>
        {I.search({ width: 18, height: 18, style: { color: T.ink2, flex: "0 0 auto" } })}
        <span style={{ color: T.ink2, fontSize: 15, whiteSpace: "nowrap", fontFamily: T.sans }}>Search your campus or area…</span>
      </div>
      <Button size="md" full={mobile} onClick={() => go("search")} style={{ borderRadius: mobile ? 12 : 999, whiteSpace: "nowrap" }}>Search homes</Button>
    </div>
  );
}

export default function HomePage() {
  const { go, campus } = useApp();
  const { mobile } = useViewport();
  const featured = LISTINGS.filter((l) => l.featured).slice(0, 4);
  const pad = mobile ? "0 20px" : "0 40px";

  return (
    <div style={{ background: T.paper, minHeight: "100vh" }}>
      <PublicNav />

      {/* Hero */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: mobile ? "24px 20px 30px" : "40px 40px 60px", display: mobile ? "block" : "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        <div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: T.clay, fontSize: 12.5, fontWeight: 600, background: "rgba(199,91,42,.09)", padding: "6px 13px 6px 11px", borderRadius: 999, whiteSpace: "nowrap", fontFamily: T.sans }}>
            {I.shield({ width: 14, height: 14, style: { flex: "0 0 auto" } })} Verified student housing across Nigeria
          </span>
          <h1 style={{ margin: "20px 0 0", fontFamily: T.serif, fontWeight: 400, fontSize: mobile ? 46 : 78, lineHeight: 0.98, letterSpacing: "-.02em", color: T.ink }}>
            Find your<br />campus <span style={{ fontStyle: "italic", color: T.clay }}>home</span>.
          </h1>
          <p style={{ fontFamily: T.sans, fontSize: mobile ? 15.5 : 17.5, color: T.ink2, lineHeight: 1.55, maxWidth: 400, marginTop: 18 }}>
            Every home is admin-checked before it goes live. No agents, no hidden fees — just real homes from real landlords near your campus, with your money protected until you move in.
          </p>
          <div style={{ marginTop: mobile ? 24 : 30 }}><HeroSearch mobile={mobile} /></div>
          <div style={{ display: "flex", gap: mobile ? 24 : 40, marginTop: mobile ? 24 : 34 }}>
            {[["240+", "verified homes"], ["8", "campus areas"], ["₦60k+", "from / year"]].map(([n, t]) => (
              <div key={t}>
                <div style={{ fontFamily: T.serif, fontSize: mobile ? 24 : 31, fontWeight: 600, color: T.ink }}>{n}</div>
                <div style={{ fontSize: 12.5, color: T.ink2, fontFamily: T.sans }}>{t}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating media card */}
        <div style={{ position: "relative", marginTop: mobile ? 34 : 0, height: mobile ? 380 : 540 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 28, overflow: "hidden", boxShadow: "0 40px 80px -40px rgba(33,29,24,.55)" }}>
            <TourVideo />
          </div>
          <div style={{ position: "absolute", left: mobile ? 14 : 20, right: mobile ? 14 : 20, bottom: mobile ? 14 : 20, background: "rgba(255,255,255,.93)", backdropFilter: "blur(8px)", borderRadius: 18, padding: mobile ? 14 : 18 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 11 }}>
              <Pill>Self-contain</Pill><Pill>0.5 km to gate</Pill>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: T.serif, fontSize: mobile ? 18 : 21, fontWeight: 600, lineHeight: 1.15, whiteSpace: "nowrap" }}>Spacious Self-Contain</div>
                <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink2, marginTop: 4 }}>Uro · Listed by Adebayo O.</div>
              </div>
              <div style={{ fontFamily: T.serif, fontSize: mobile ? 20 : 24, fontWeight: 700, color: T.clay, flex: "0 0 auto" }}>{naira(180000)}</div>
            </div>
          </div>
          <div onClick={() => go("property", "uro-sc")} style={{ position: "absolute", top: mobile ? 14 : 20, right: mobile ? 14 : 20, display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.93)", borderRadius: 999, padding: "7px 7px 7px 14px", fontSize: 12, fontWeight: 600, fontFamily: T.sans, cursor: "pointer" }}>
            Tour <span style={{ width: 26, height: 26, borderRadius: 999, background: T.clay, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="#fff"><path d="M3 2l7 4-7 4z" /></svg></span>
          </div>
        </div>
      </div>

      {/* Featured */}
      <div style={{ background: T.paper2, padding: mobile ? "34px 0" : "60px 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: pad }}>
          <SectionHead eyebrow="Latest listings" title="Featured homes" mobile={mobile}
            action={!mobile ? <Button variant="ghost" iconRight={I.arrow} onClick={() => go("search")}>View all</Button> : undefined} />
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(4,1fr)", gap: mobile ? 16 : 20 }}>
            {featured.map((l) => <PropertyCard key={l.id} l={l} mobile={mobile} onClick={() => go("property", l.id)} />)}
          </div>
          {mobile && <div style={{ marginTop: 18 }}><Button full variant="outline" iconRight={I.arrow} onClick={() => go("search")}>View all homes</Button></div>}
        </div>
      </div>

      {/* How it stays safe */}
      <div id="how-it-works" style={{ maxWidth: 1280, margin: "0 auto", padding: mobile ? "38px 20px" : "64px 40px" }}>
        <SectionHead eyebrow="Built on trust" title="How it stays safe" mobile={mobile} />
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap: mobile ? 14 : 22 }}>
          {([[I.shield, "01", "Listings are reviewed", "Our admins check every property and its photos before it ever appears in search."],
            [I.user, "02", "Landlords are ID-checked", "Government ID, a selfie and proof of ownership — all verified before a landlord can list."],
            [I.wallet, "03", "Payment is protected", "We hold your rent securely and release it to the landlord only after you confirm move-in."]] as const).map(([Ic, n, t, d]) => (
            <Card key={n} pad={mobile ? 22 : 28}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: T.claySoft, color: T.clay, display: "flex", alignItems: "center", justifyContent: "center" }}>{Ic({ width: 22, height: 22 })}</div>
                <span style={{ fontFamily: T.serif, fontSize: 30, color: T.line, fontWeight: 600 }}>{n}</span>
              </div>
              <div style={{ fontFamily: T.serif, fontSize: mobile ? 20 : 23, marginTop: 16, color: T.ink }}>{t}</div>
              <div style={{ fontFamily: T.sans, fontSize: 14, color: T.ink2, marginTop: 8, lineHeight: 1.55 }}>{d}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Areas */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: mobile ? "0 20px 40px" : "0 40px 64px" }}>
        <SectionHead eyebrow={"In " + campus.short} title="Browse by area" mobile={mobile} />
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap: mobile ? 12 : 16 }}>
          {AREAS.map((a, i) => {
            const count = LISTINGS.filter((l) => l.area === a).length;
            const tones: [string, string][] = [["#d8c4a0", "#9c8055"], ["#c8bca6", "#7d7158"], ["#cdb89c", "#8a7150"], ["#bcae9a", "#6f6450"]];
            return (
              <div key={a} onClick={() => go("search", null, { area: a })} style={{ position: "relative", height: mobile ? 110 : 150, borderRadius: 16, overflow: "hidden", cursor: "pointer" }}>
                <Photo from={tones[i % 4][0]} to={tones[i % 4][1]} tag={false} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,.5), rgba(0,0,0,0) 70%)" }} />
                <div style={{ position: "absolute", bottom: 12, left: 14, color: "#fff" }}>
                  <div style={{ fontFamily: T.serif, fontSize: mobile ? 17 : 20, fontWeight: 500 }}>{a}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 12, opacity: 0.85 }}>{count} {count === 1 ? "home" : "homes"}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA band */}
      <div style={{ background: T.clay, color: "#fff", padding: mobile ? "40px 20px" : "64px 40px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: mobile ? "block" : "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: T.serif, fontWeight: 400, fontSize: mobile ? 32 : 46, letterSpacing: "-.02em", lineHeight: 1.05 }}>Have a place to rent out?</h2>
            <p style={{ fontFamily: T.sans, fontSize: mobile ? 15.5 : 18, opacity: 0.9, marginTop: 14, maxWidth: 460, lineHeight: 1.5 }}>
              List your property to verified students near your campus. Get verified once, and we handle payments for you — securely held until your tenant moves in.
            </p>
          </div>
          <div style={{ marginTop: mobile ? 22 : 0, flex: "0 0 auto" }}>
            <Button size="lg" variant="dark" iconRight={I.arrow} onClick={() => go("register")}>List a property</Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
