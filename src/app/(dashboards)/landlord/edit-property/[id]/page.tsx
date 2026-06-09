"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { T, I, amenityIcon, Logo } from "@/lib/rh/theme";
import { AMENITY_GROUPS } from "@/lib/rh/data";
import { useApp, useViewport } from "@/components/rh/app";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/rh/ui";
import { getProperty, getLocations, updateProperty, type ApiProperty } from "@/lib/rh/api";

export default function EditPropertyPage() {
  const { go, showToast } = useApp();
  const { mobile } = useViewport();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [orig, setOrig] = useState<ApiProperty | null>(null);

  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [price, setPrice] = useState<string>("");
  const [desc, setDesc] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([getProperty(id), getLocations()]).then(([p, l]) => {
      if (!active) return;
      if (l.status === "fulfilled") setLocations(l.value);
      if (p.status === "fulfilled") {
        const prop = p.value;
        setOrig(prop);
        setTitle(prop.title);
        setArea(prop.location?.name ?? "");
        setPrice(String(Number(prop.price) || 0));
        setDesc(prop.description ?? "");
        setAmenities(Array.isArray(prop.amenities) ? (prop.amenities as string[]) : []);
      } else {
        setError("Couldn't load this listing.");
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  const toggleAmen = (a: string) => setAmenities((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));

  const save = async () => {
    setError(null);
    if (!title.trim() || !price) { setError("Title and rent are required."); return; }
    setSaving(true);
    try {
      const locationId = locations.find((l) => l.name === area)?.id ?? orig?.location?.id;
      await updateProperty(id, {
        title: title.trim(),
        description: desc.trim() || title.trim(),
        price: Number(price),
        locationId,
        distanceToCampus: orig?.distanceToCampus != null ? Number(orig.distanceToCampus) : undefined,
        amenities,
      });
      showToast("Listing updated — sent for review");
      go("manage", id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save changes");
    } finally {
      setSaving(false);
    }
  };

  const areaOptions = locations.length ? locations.map((l) => l.name) : (area ? [area] : []);

  return (
    <div style={{ background: T.paper, minHeight: "100vh" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(244,238,228,.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid " + T.line2 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={() => go("home")} style={{ cursor: "pointer" }}><Logo size={24} fontSize={20} /></div>
          <span onClick={() => go("manage", id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: T.sans, fontSize: 13.5, color: T.ink2, cursor: "pointer" }}>{I.arrowLeft({ width: 16, height: 16 })}Back to listing</span>
        </div>
      </div>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: mobile ? "20px" : "32px 24px 56px" }}>
        <h1 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: mobile ? 30 : 40, letterSpacing: "-.02em", color: T.ink, margin: 0 }}>Edit listing</h1>
        <p style={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink2, marginTop: 8 }}>Changes are re-checked by our admin team before going live.</p>

        {loading ? (
          <Card pad={40} style={{ marginTop: 22, textAlign: "center" }}><div style={{ fontFamily: T.sans, color: T.ink2 }}>Loading listing…</div></Card>
        ) : (
          <>
            <Card pad={mobile ? 22 : 28} style={{ marginTop: 22 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Field label="Property title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
                <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                  <Field label="Area / neighbourhood"><Select value={area} onChange={(e) => setArea(e.target.value)}>{areaOptions.map((a) => <option key={a}>{a}</option>)}</Select></Field>
                  <Field label="Rent / year (₦)"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
                </div>
                <Field label="Description"><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
                <div>
                  <div style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: T.ink2, marginBottom: 10 }}>Amenities</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {Object.values(AMENITY_GROUPS).flat().map((a) => { const on = amenities.includes(a); return (
                      <span key={a} onClick={() => toggleAmen(a)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 999, cursor: "pointer", fontFamily: T.sans, fontSize: 13, fontWeight: 600, background: on ? T.clay : "#fff", color: on ? "#fff" : T.ink2, border: "1px solid " + (on ? T.clay : T.line) }}>{amenityIcon(a, { width: 13, height: 13 })}{a}</span>
                    ); })}
                  </div>
                </div>
                <p style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3, margin: 0 }}>Photos are managed when you create a listing; photo editing is coming soon.</p>
              </div>
            </Card>
            {error && <div style={{ fontFamily: T.sans, fontSize: 13, color: T.red, background: T.redSoft, borderRadius: 10, padding: "10px 14px", marginTop: 16 }}>{error}</div>}
            <div style={{ display: "flex", gap: 12, marginTop: 22, justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => go("manage", id)}>Cancel</Button>
              <Button variant="dark" icon={I.check} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save changes"}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
