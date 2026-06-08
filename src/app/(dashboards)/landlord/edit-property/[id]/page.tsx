"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { T, I, amenityIcon, Photo, Logo } from "@/lib/rh/theme";
import { listingById, PROPERTY_TYPES, AMENITY_GROUPS, AREAS } from "@/lib/rh/data";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/rh/ui";

interface EditData { title: string; type: string; units: number | string; gender: string; desc: string; area: string; price: number | string; agency: number; caution: number; landmark: string; amenities: string[] }

export default function EditPropertyPage() {
  const { go, showToast } = useApp();
  const { mobile } = useViewport();
  const { id } = useParams<{ id: string }>();
  const l = listingById(id) || listingById("uro-sc")!;
  const [d, setD] = useState<EditData>({ title: l.title, type: l.type, units: l.vacant, gender: l.gender, desc: l.desc, area: l.area, price: l.price, agency: 0, caution: 0, landmark: l.landmark, amenities: l.amenities });
  const set = (k: keyof EditData, v: string | number) => setD((p) => ({ ...p, [k]: v }));
  const toggleAmen = (a: string) => setD((p) => ({ ...p, amenities: p.amenities.includes(a) ? p.amenities.filter((x) => x !== a) : [...p.amenities, a] }));

  return (
    <div style={{ background: T.paper, minHeight: "100vh" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(244,238,228,.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid " + T.line2 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={() => go("home")} style={{ cursor: "pointer" }}><Logo size={24} fontSize={20} /></div>
          <span onClick={() => go("manage", l.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: T.sans, fontSize: 13.5, color: T.ink2, cursor: "pointer" }}>{I.arrowLeft({ width: 16, height: 16 })}Back to listing</span>
        </div>
      </div>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: mobile ? "20px" : "32px 24px 56px" }}>
        <h1 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: mobile ? 30 : 40, letterSpacing: "-.02em", color: T.ink, margin: 0 }}>Edit listing</h1>
        <p style={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink2, marginTop: 8 }}>Changes are re-checked by our admin team before going live.</p>

        <Card pad={mobile ? 22 : 28} style={{ marginTop: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Property title"><Input value={d.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              <Field label="Property type"><Select value={d.type} onChange={(e) => set("type", e.target.value)}>{PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
              <Field label="Vacant units"><Input type="number" min="1" value={d.units} onChange={(e) => set("units", e.target.value)} /></Field>
            </div>
            <Field label="Who can rent?">
              <div style={{ display: "flex", gap: 10 }}>{["Any", "Female", "Male"].map((g) => <div key={g} onClick={() => set("gender", g)} style={{ flex: 1, textAlign: "center", padding: "11px", borderRadius: 11, cursor: "pointer", fontFamily: T.sans, fontSize: 14, fontWeight: 600, background: d.gender === g ? T.clay : "#fff", color: d.gender === g ? "#fff" : T.ink2, border: "1px solid " + (d.gender === g ? T.clay : T.line) }}>{g}</div>)}</div>
            </Field>
            <Field label="Description"><Textarea value={d.desc} onChange={(e) => set("desc", e.target.value)} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              <Field label="Area / neighbourhood"><Select value={d.area} onChange={(e) => set("area", e.target.value)}>{AREAS.map((a) => <option key={a}>{a}</option>)}</Select></Field>
              <Field label="Rent / year (₦)"><Input type="number" value={d.price} onChange={(e) => set("price", e.target.value)} /></Field>
            </div>
            <Field label="Landmark / directions"><Input value={d.landmark} onChange={(e) => set("landmark", e.target.value)} /></Field>
            <div>
              <div style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: T.ink2, marginBottom: 10 }}>Amenities</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.values(AMENITY_GROUPS).flat().map((a) => { const on = d.amenities.includes(a); return (
                  <span key={a} onClick={() => toggleAmen(a)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 999, cursor: "pointer", fontFamily: T.sans, fontSize: 13, fontWeight: 600, background: on ? T.clay : "#fff", color: on ? "#fff" : T.ink2, border: "1px solid " + (on ? T.clay : T.line) }}>{amenityIcon(a, { width: 13, height: 13 })}{a}</span>
                ); })}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: T.ink2, marginBottom: 8 }}>Photos</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {[0, 1, 2].map((i) => <div key={i} style={{ aspectRatio: "1", borderRadius: 12, overflow: "hidden" }}><Photo from={l.from} to={l.to} seed={i} tag={false} /></div>)}
                <div style={{ aspectRatio: "1", borderRadius: 12, border: "1.5px dashed " + T.line, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", color: T.ink2, background: "#fff" }}>{I.plus({ width: 22, height: 22 })}<span style={{ fontFamily: T.sans, fontSize: 11 }}>Add</span></div>
              </div>
            </div>
          </div>
        </Card>
        <div style={{ display: "flex", gap: 12, marginTop: 22, justifyContent: "flex-end" }}>
          <Button variant="outline" onClick={() => go("manage", l.id)}>Cancel</Button>
          <Button variant="dark" icon={I.check} onClick={() => { showToast("Listing updated — sent for review"); go("manage", l.id); }}>Save changes</Button>
        </div>
      </div>
    </div>
  );
}
