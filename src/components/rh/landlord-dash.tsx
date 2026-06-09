"use client";

import { useEffect, useState } from "react";
import { T, naira, I, Photo, amenityIcon } from "@/lib/rh/theme";
import { PROPERTY_TYPES, DISTANCES, AMENITY_GROUPS, AREAS } from "@/lib/rh/data";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Card, Avatar, StatusBadge, Pill, Field, Input, Select, Textarea } from "@/components/rh/ui";
import { DashShell, Stat, EmptyState } from "@/components/rh/dash-shell";
import { getMyListings, getLandlordRequests, getEarnings, setBookingStatus, mapProperty, mapRequest, uploadFile, createProperty, type UiListing, type UiRequest, type EarningsData } from "@/lib/rh/api";

function initialsOf(name: string) {
  return (name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()) || "?";
}

function VerifyBanner({ status, onStart }: { status: string; onStart: () => void }) {
  if (status === "VERIFIED") return (
    <Card pad={16} style={{ background: T.greenSoft, border: "1px solid " + T.green + "22", display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
      {I.shield({ width: 20, height: 20, style: { color: T.green, flex: "0 0 auto" } })}
      <span style={{ fontFamily: T.sans, fontSize: 13.5, color: T.green, fontWeight: 600 }}>Your account is verified — students can see the verified badge on your listings.</span>
    </Card>
  );
  const cfg = ({
    UNVERIFIED: { tone: T.gold, soft: T.goldSoft, msg: "Your account is not yet verified. Verify to earn the trusted badge and unlock payouts.", cta: "Start verification" },
    UNDER_REVIEW: { tone: T.blue, soft: T.blueSoft, msg: "Your documents are under review. We’ll notify you within 24–48 hours.", cta: null },
  } as Record<string, { tone: string; soft: string; msg: string; cta: string | null }>)[status];
  if (!cfg) return null;
  return (
    <Card pad={16} style={{ background: cfg.soft, border: "1px solid " + cfg.tone + "22", display: "flex", alignItems: "center", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
      {I.shieldAlert({ width: 20, height: 20, style: { color: cfg.tone, flex: "0 0 auto" } })}
      <span style={{ flex: 1, minWidth: 200, fontFamily: T.sans, fontSize: 13.5, color: T.ink, fontWeight: 500 }}>{cfg.msg}</span>
      {cfg.cta && <Button size="sm" variant="dark" onClick={onStart}>{cfg.cta}</Button>}
    </Card>
  );
}

function VerificationFlow({ status, setStatus }: { status: string; setStatus: (s: string) => void }) {
  const { showToast } = useApp();
  const { mobile } = useViewport();
  const docs: [string, string, (p?: Record<string, unknown>) => React.ReactElement][] = [
    ["Government ID", "NIN slip, driver’s licence or international passport", I.user],
    ["Selfie with ID", "A clear photo of you holding your ID", I.eye],
    ["Proof of ownership", "Deed, receipt, or authorisation letter for the property", I.home],
  ];
  const [done, setDone] = useState([false, false, false]);
  if (status === "UNDER_REVIEW") {
    return (
      <Card pad={mobile ? 24 : 36} style={{ maxWidth: 620, textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: 18, background: T.blueSoft, color: T.blue, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>{I.clock({ width: 28, height: 28 })}</div>
        <h2 style={{ fontFamily: T.serif, fontSize: 28, color: T.ink, margin: 0, fontWeight: 500 }}>Documents under review</h2>
        <p style={{ fontFamily: T.sans, fontSize: 15, color: T.ink2, lineHeight: 1.6, marginTop: 12 }}>Thanks — our team is checking your documents. You&apos;ll get an email within 24–48 hours. Your listings stay live in the meantime.</p>
        <div style={{ marginTop: 18 }}><Pill tone="blue" icon={I.sparkle}>AI pre-screen: passed</Pill></div>
      </Card>
    );
  }
  return (
    <Card pad={mobile ? 22 : 32} style={{ maxWidth: 620 }}>
      <h2 style={{ fontFamily: T.serif, fontSize: 28, color: T.ink, margin: 0, fontWeight: 500 }}>Get verified</h2>
      <p style={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink2, lineHeight: 1.6, marginTop: 10 }}>Upload three documents. We verify your identity and ownership so students can trust your listings — and so we can pay you out.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
        {docs.map(([t, d, Ic], i) => (
          <div key={t} onClick={() => setDone((p) => p.map((x, j) => (j === i ? true : x)))} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, border: "1px dashed " + (done[i] ? T.green : T.line), borderRadius: 14, cursor: "pointer", background: done[i] ? T.greenSoft : "#fff" }}>
            <span style={{ width: 42, height: 42, borderRadius: 11, background: done[i] ? "#fff" : T.paper, color: done[i] ? T.green : T.clay, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>{done[i] ? I.check({ width: 20, height: 20 }) : Ic({ width: 20, height: 20 })}</span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, color: T.ink }}>{t}</div><div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink2 }}>{d}</div></div>
            <span style={{ color: done[i] ? T.green : T.ink3, fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>{done[i] ? "Uploaded" : <>{I.upload({ width: 15, height: 15 })} Upload</>}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22 }}><Button full size="lg" disabled={!done.every(Boolean)} onClick={() => { setStatus("UNDER_REVIEW"); showToast("Documents submitted for review"); }}>Submit for verification</Button></div>
      <p style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3, marginTop: 12, textAlign: "center" }}>Document upload + submission isn&apos;t wired to the backend yet.</p>
    </Card>
  );
}

interface WizData { title: string; type: string; units: number | string; gender: string; desc: string; area: string; dist: string; amenities: string[]; price: string; agency: string; caution: string; landmark: string }

function AddPropertyWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { showToast } = useApp();
  const { mobile } = useViewport();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizData>({ title: "", type: "", units: 1, gender: "Any", desc: "", area: "", dist: "", amenities: [], price: "", agency: "", caution: "", landmark: "" });
  const set = (k: keyof WizData, v: string | number) => setData((d) => ({ ...d, [k]: v }));
  const toggleAmen = (a: string) => setData((d) => ({ ...d, amenities: d.amenities.includes(a) ? d.amenities.filter((x) => x !== a) : [...d.amenities, a] }));
  const steps = ["Basics", "Location & amenities", "Pricing & photos"];
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const distToKm = (d: string): number | undefined => ({ "Under 500m": 0.4, "500m – 1km": 0.8, "1 – 2km": 1.5, "2 – 5km": 3.5, "Over 5km": 6 } as Record<string, number>)[d];

  const submit = async () => {
    setError(null);
    if (!data.title.trim() || !data.type || !data.area || !data.price) { setError("Add a title, type, area and rent before submitting."); return; }
    setBusy(true);
    try {
      const images = files.length ? await Promise.all(files.map((f) => uploadFile(f))) : [];
      await createProperty({
        title: data.title.trim(),
        description: data.desc.trim() || data.title.trim(),
        price: Number(data.price),
        locationName: data.area,
        distanceToCampus: distToKm(data.dist),
        amenities: data.amenities,
        images,
        vacantUnits: Number(data.units) || 1,
      });
      showToast("Listing submitted for review");
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't submit listing");
    } finally {
      setBusy(false);
    }
  };

  const genDesc = () => {
    const t = data.type || "home";
    set("desc", `A well-kept ${t.toLowerCase()} in ${data.area || "a quiet area"} near campus, ideal for students. ${data.amenities.slice(0, 3).join(", ")}${data.amenities.length ? " and more." : ""} Close to transport and the campus gate.`);
    showToast("Description drafted by AI — edit as you like");
  };
  const priceHint = data.type.includes("2-bed") ? 320000 : data.type.includes("3-bed") ? 450000 : data.type.includes("Self") ? 175000 : 130000;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(33,29,24,.6)", backdropFilter: "blur(3px)", display: "flex", alignItems: mobile ? "flex-end" : "center", justifyContent: "center", padding: mobile ? 0 : 24 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.paper, borderRadius: mobile ? "20px 20px 0 0" : 22, width: "100%", maxWidth: 680, maxHeight: mobile ? "94vh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid " + T.line }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontFamily: T.serif, fontSize: 26, color: T.ink, fontWeight: 500 }}>List a property</h2>
            <span onClick={onClose} style={{ cursor: "pointer", color: T.ink2 }}>{I.x({ width: 22, height: 22 })}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ flex: 1 }}>
                <div style={{ height: 4, borderRadius: 4, background: i <= step ? T.clay : T.line }} />
                <div style={{ fontFamily: T.sans, fontSize: 11.5, color: i === step ? T.clay : T.ink3, marginTop: 7, fontWeight: i === step ? 700 : 500 }}>{i + 1}. {s}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Property title"><Input value={data.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Spacious Self-Contain near gate" /></Field>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                <Field label="Property type"><Select value={data.type} onChange={(e) => set("type", e.target.value)}><option value="">Select type…</option>{PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
                <Field label="Vacant units"><Input type="number" min="1" value={data.units} onChange={(e) => set("units", e.target.value)} /></Field>
              </div>
              <Field label="Who can rent?">
                <div style={{ display: "flex", gap: 10 }}>{["Any", "Female", "Male"].map((g) => <div key={g} onClick={() => set("gender", g)} style={{ flex: 1, textAlign: "center", padding: "11px", borderRadius: 11, cursor: "pointer", fontFamily: T.sans, fontSize: 14, fontWeight: 600, background: data.gender === g ? T.clay : "#fff", color: data.gender === g ? "#fff" : T.ink2, border: "1px solid " + (data.gender === g ? T.clay : T.line) }}>{g}</div>)}</div>
              </Field>
              <Field label={<span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>Description <span onClick={genDesc} style={{ color: T.clay, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, whiteSpace: "nowrap" }}>{I.sparkle({ width: 13, height: 13 })} Draft with AI</span></span> as unknown as string}>
                <Textarea value={data.desc} onChange={(e) => set("desc", e.target.value)} placeholder="Describe the home, its highlights and what makes it good for students…" />
              </Field>
            </div>
          )}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                <Field label="Area / neighbourhood"><Select value={data.area} onChange={(e) => set("area", e.target.value)}><option value="">Select area…</option>{AREAS.map((a) => <option key={a}>{a}</option>)}</Select></Field>
                <Field label="Distance to campus"><Select value={data.dist} onChange={(e) => set("dist", e.target.value)}><option value="">Select…</option>{DISTANCES.map((d) => <option key={d}>{d}</option>)}</Select></Field>
              </div>
              <Field label="Landmark / directions"><Input value={data.landmark} onChange={(e) => set("landmark", e.target.value)} placeholder="e.g. 3 houses from Amoye GS gate, opposite the mosque" /></Field>
              <div>
                <div style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: T.ink2, marginBottom: 10 }}>Amenities</div>
                {Object.entries(AMENITY_GROUPS).map(([group, items]) => (
                  <div key={group} style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: T.sans, fontSize: 11.5, fontWeight: 700, color: T.ink3, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>{group}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {items.map((a) => { const on = data.amenities.includes(a); return (
                        <span key={a} onClick={() => toggleAmen(a)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 999, cursor: "pointer", fontFamily: T.sans, fontSize: 13, fontWeight: 600, background: on ? T.clay : "#fff", color: on ? "#fff" : T.ink2, border: "1px solid " + (on ? T.clay : T.line) }}>{amenityIcon(a, { width: 13, height: 13 })}{a}</span>
                      ); })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card pad={14} style={{ background: T.claySoft, border: "none", display: "flex", alignItems: "center", gap: 11 }}>
                {I.sparkle({ width: 18, height: 18, style: { color: T.clay, flex: "0 0 auto" } })}
                <span style={{ fontFamily: T.sans, fontSize: 13, color: T.clayDeep }}>AI price guide: similar {data.type || "homes"} in {data.area || "this area"} rent for around <strong>{naira(priceHint)}/year</strong>.</span>
              </Card>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: 14 }}>
                <Field label="Rent / year (₦)"><Input type="number" value={data.price} onChange={(e) => set("price", e.target.value)} placeholder={String(priceHint)} /></Field>
                <Field label="Agency fee (₦)" hint="Optional"><Input type="number" value={data.agency} onChange={(e) => set("agency", e.target.value)} placeholder="0" /></Field>
                <Field label="Caution fee (₦)" hint="Optional"><Input type="number" value={data.caution} onChange={(e) => set("caution", e.target.value)} placeholder="0" /></Field>
              </div>
              <div>
                <div style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: T.ink2, marginBottom: 8 }}>Photos</div>
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "22px", borderRadius: 12, border: "1.5px dashed " + T.line, cursor: "pointer", color: T.ink2, background: "#fff" }}>
                  {I.upload({ width: 22, height: 22 })}
                  <span style={{ fontFamily: T.sans, fontSize: 13 }}>{files.length ? `${files.length} photo${files.length === 1 ? "" : "s"} selected` : "Tap to add photos"}</span>
                  <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} style={{ display: "none" }} />
                </label>
                {files.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 10 }}>
                    {files.slice(0, 8).map((f, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={URL.createObjectURL(f)} alt="" style={{ aspectRatio: "1", width: "100%", objectFit: "cover", borderRadius: 12 }} />
                    ))}
                  </div>
                )}
              </div>
              {error && <div style={{ fontFamily: T.sans, fontSize: 13, color: T.red, background: T.redSoft, borderRadius: 10, padding: "10px 14px" }}>{error}</div>}
              <Card pad={14} style={{ background: T.greenSoft, border: "none", display: "flex", alignItems: "flex-start", gap: 11 }}>
                {I.shield({ width: 18, height: 18, style: { color: T.green, flex: "0 0 auto", marginTop: 1 } })}
                <span style={{ fontFamily: T.sans, fontSize: 12.5, color: T.green, lineHeight: 1.5 }}>Your listing goes to our admin team for review (usually within 24 hours) before appearing in search.</span>
              </Card>
            </div>
          )}
        </div>

        <div style={{ padding: 20, borderTop: "1px solid " + T.line, background: "#fff", display: "flex", gap: 12, justifyContent: "space-between" }}>
          <Button variant="outline" onClick={() => (step === 0 ? onClose() : setStep(step - 1))}>{step === 0 ? "Cancel" : "Back"}</Button>
          {step < 2
            ? <Button onClick={() => setStep(step + 1)} iconRight={I.arrow}>Continue</Button>
            : <Button variant="dark" icon={I.check} disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Submit listing"}</Button>}
        </div>
      </div>
    </div>
  );
}

export function LandlordDash({ initial, openAdd }: { initial?: string; openAdd?: boolean }) {
  const { go, showToast, user } = useApp();
  const { mobile } = useViewport();
  const [tab, setTab] = useState(initial || "listings");
  const [vstatus, setVstatus] = useState("UNVERIFIED");
  const [adding, setAdding] = useState(!!openAdd);

  const [listings, setListings] = useState<UiListing[]>([]);
  const [requests, setRequests] = useState<UiRequest[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([getMyListings(), getLandlordRequests(), getEarnings()]).then((res) => {
      if (!active) return;
      const [l, r, e] = res;
      if (l.status === "fulfilled") setListings(l.value.items.map(mapProperty));
      if (r.status === "fulfilled") setRequests(r.value.map(mapRequest));
      if (e.status === "fulfilled") setEarnings(e.value);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const pendingReqs = requests.filter((r) => r.status === "PENDING").length;
  const reqCountFor = (pid: string) => requests.filter((r) => r.propertyId === pid).length;

  const act = async (id: string, status: "CONFIRMED" | "CANCELLED") => {
    try {
      await setBookingStatus(id, status);
      setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
      showToast(status === "CONFIRMED" ? "Offer accepted — student notified" : "Offer declined");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Action failed");
    }
  };

  return (
    <DashShell role="landlord" tab={tab} setTab={setTab} title="Landlord dashboard" subtitle="Manage your listings and tenant requests"
      badges={{ requests: pendingReqs || undefined }}
      action={<Button icon={I.plus} onClick={() => setAdding(true)} size={mobile ? "sm" : "md"}>{mobile ? "Add" : "Add property"}</Button>}>

      <VerifyBanner status={vstatus} onStart={() => setTab("verification")} />

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap: mobile ? 12 : 18, marginBottom: 26 }}>
        <Stat label="Total listings" value={listings.length} tone="ink" icon={I.building} onClick={() => setTab("listings")} active={tab === "listings"} />
        <Stat label="Pending requests" value={pendingReqs} tone="clay" icon={I.inbox} onClick={() => setTab("requests")} active={tab === "requests"} />
        <Stat label="Paid bookings" value={earnings?.totalPaidBookings ?? 0} tone="green" icon={I.checkCircle} />
        <Stat label="All-time earnings" value={naira(earnings?.totalEarnings ?? 0)} tone="gold" icon={I.wallet} onClick={() => setTab("earnings")} active={tab === "earnings"} />
      </div>

      {tab === "listings" && (
        loading ? <Card pad={40} style={{ textAlign: "center" }}><div style={{ fontFamily: T.sans, color: T.ink2 }}>Loading your listings…</div></Card>
        : listings.length === 0 ? <EmptyState icon={I.building} title="No listings yet" sub="Add your first property to start receiving tenant requests." action={<Button icon={I.plus} onClick={() => setAdding(true)}>Add property</Button>} />
        : (
          <Card pad={0} style={{ overflow: "hidden" }}>
            {listings.map((l, i) => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: mobile ? 14 : 18, borderTop: i ? "1px solid " + T.line2 : "none" }}>
                <div style={{ width: mobile ? 56 : 72, height: mobile ? 56 : 72, borderRadius: 12, overflow: "hidden", flex: "0 0 auto" }}>
                  {l.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Photo from={l.from} to={l.to} tag={false} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.serif, fontSize: mobile ? 17 : 19, color: T.ink, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.title}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink2, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>{I.pin({ width: 12, height: 12 })}{l.area} · {naira(l.price)}/yr</div>
                </div>
                <div style={{ textAlign: "center", flex: "0 0 auto" }}>
                  <div style={{ fontFamily: T.serif, fontSize: 19, color: T.ink, fontWeight: 600 }}>{reqCountFor(l.id)}</div>
                  <div style={{ fontFamily: T.sans, fontSize: 10.5, color: T.ink3 }}>requests</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => go("manage", l.id)} iconRight={I.chevRight}>{mobile ? "" : "Manage"}</Button>
              </div>
            ))}
          </Card>
        )
      )}

      {tab === "requests" && (
        loading ? <Card pad={40} style={{ textAlign: "center" }}><div style={{ fontFamily: T.sans, color: T.ink2 }}>Loading requests…</div></Card>
        : requests.length === 0 ? <EmptyState title="No tenant requests yet" sub="When students place offers on your homes, they'll appear here." />
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {requests.map((r) => (
              <Card key={r.id} pad={mobile ? 16 : 20}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 14, minWidth: 0, flex: 1 }}>
                    <Avatar landlord={{ initials: initialsOf(r.studentName), color: "#3C5A86" }} size={46} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: T.sans, fontSize: 15.5, fontWeight: 700, color: T.ink }}>{r.studentName}</div>
                      <div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, marginTop: 1 }}>{r.propertyTitle}</div>
                      <div style={{ fontFamily: T.sans, fontSize: 13.5, marginTop: 8 }}>Offer: <strong style={{ color: T.green, fontSize: 15 }}>{naira(r.bid)}</strong></div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: mobile ? "stretch" : "flex-end", gap: 8, flex: "0 0 auto" }}>
                    {r.status === "PENDING" ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button variant="danger" size="sm" onClick={() => act(r.id, "CANCELLED")}>Decline</Button>
                        <Button variant="green" size="sm" onClick={() => act(r.id, "CONFIRMED")}>Accept</Button>
                      </div>
                    ) : <StatusBadge status={r.status} />}
                    <span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "earnings" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap: 18, marginBottom: 24 }}>
            <Card pad={22} style={{ background: T.greenSoft, border: "none" }}><div style={{ fontFamily: T.sans, fontSize: 13, color: T.green, fontWeight: 600 }}>Total earnings</div><div style={{ fontFamily: T.serif, fontSize: 36, fontWeight: 600, color: T.green, marginTop: 6 }}>{naira(earnings?.totalEarnings ?? 0)}</div><div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink2, marginTop: 2 }}>All time</div></Card>
            <Card pad={22}><div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, fontWeight: 600 }}>This month</div><div style={{ fontFamily: T.serif, fontSize: 36, fontWeight: 600, color: T.ink, marginTop: 6 }}>{naira(earnings?.monthlyEarnings ?? 0)}</div></Card>
            <Card pad={22}><div style={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, fontWeight: 600 }}>Paid bookings</div><div style={{ fontFamily: T.serif, fontSize: 36, fontWeight: 600, color: T.ink, marginTop: 6 }}>{earnings?.totalPaidBookings ?? 0}</div></Card>
          </div>
          <Card pad={0} style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid " + T.line2, fontFamily: T.serif, fontSize: 20, color: T.ink }}>Payment history</div>
            {!earnings || earnings.bookings.length === 0 ? (
              <div style={{ padding: 24, fontFamily: T.sans, fontSize: 14, color: T.ink2 }}>No payments yet.</div>
            ) : earnings.bookings.map((row, i) => (
              <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: mobile ? "14px 16px" : "16px 20px", borderTop: i ? "1px solid " + T.line2 : "none", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 140 }}><div style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 600, color: T.ink }}>{row.propertyTitle}</div><div style={{ fontFamily: T.sans, fontSize: 12, color: T.ink2 }}>{row.studentName}{row.moveInDate ? ` · moved in ${new Date(row.moveInDate).toLocaleDateString()}` : ""}</div></div>
                <div style={{ fontFamily: T.serif, fontSize: 18, fontWeight: 600, color: T.green }}>{naira(row.amount)}</div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "verification" && <VerificationFlow status={vstatus} setStatus={setVstatus} />}

      {tab === "profile" && (
        <Card pad={mobile ? 22 : 30} style={{ maxWidth: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Avatar landlord={{ initials: initialsOf(user?.name ?? "Landlord"), color: "#2F5D4F" }} size={64} />
            <div><div style={{ fontFamily: T.serif, fontSize: 24, color: T.ink }}>{user?.name ?? "Landlord"}</div><div style={{ display: "flex", gap: 8, marginTop: 6 }}><Pill tone={user?.verificationStatus === "VERIFIED" ? "green" : "gold"} icon={I.shield}>{user?.verificationStatus ?? "UNVERIFIED"}</Pill></div></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 24 }}>
            <Field label="Display name"><Input defaultValue={user?.name ?? ""} /></Field>
            <Field label="Email"><Input defaultValue={user?.email ?? ""} /></Field>
            <div><Button onClick={() => showToast("Profile saving isn't wired yet")}>Save changes</Button></div>
          </div>
        </Card>
      )}

      {adding && <AddPropertyWizard onClose={() => setAdding(false)} onCreated={() => { getMyListings().then((r) => setListings(r.items.map(mapProperty))).catch(() => {}); }} />}
    </DashShell>
  );
}
