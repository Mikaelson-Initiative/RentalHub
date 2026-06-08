"use client";

/**
 * ui.tsx — shared building blocks ported from the Claude Design handoff:
 * buttons, pills, badges, fields, cards, section heads, property card,
 * campus picker, public nav, footer. Faithful inline-style port.
 */
import { useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { T, I, naira, amenityIcon, Photo, Logo } from "@/lib/rh/theme";
import { landlordById, CAMPUSES, type Listing } from "@/lib/rh/data";
import { useApp, useViewport } from "@/components/rh/app";

type IconFn = (p?: Record<string, unknown>) => ReactElement;

// ── Button ───────────────────────────────────────────────────
export function Button({ children, variant = "primary", size = "md", full, onClick, style = {}, icon, iconRight, type = "button", disabled }: {
  children?: ReactNode; variant?: "primary" | "dark" | "outline" | "ghost" | "soft" | "green" | "danger";
  size?: "sm" | "md" | "lg"; full?: boolean; onClick?: () => void; style?: CSSProperties;
  icon?: IconFn; iconRight?: IconFn; type?: "button" | "submit"; disabled?: boolean;
}) {
  const sizes = { sm: { p: "8px 14px", f: 13 }, md: { p: "12px 20px", f: 14.5 }, lg: { p: "15px 28px", f: 16 } };
  const s = sizes[size];
  const variants: Record<string, CSSProperties> = {
    primary: { background: T.clay, color: "#fff", border: "1px solid " + T.clay },
    dark: { background: T.ink, color: T.paper, border: "1px solid " + T.ink },
    outline: { background: "transparent", color: T.ink, border: "1px solid " + T.line },
    ghost: { background: "transparent", color: T.ink, border: "1px solid transparent" },
    soft: { background: T.claySoft, color: T.clayDeep, border: "1px solid transparent" },
    green: { background: T.green, color: "#fff", border: "1px solid " + T.green },
    danger: { background: "#fff", color: T.red, border: "1px solid " + T.redSoft },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: T.sans, fontWeight: 600, fontSize: s.f, padding: s.p, borderRadius: variant === "primary" || variant === "dark" ? 999 : 11,
      width: full ? "100%" : "auto", whiteSpace: "nowrap", transition: "filter .15s, transform .05s", opacity: disabled ? 0.5 : 1,
      ...variants[variant], ...style,
    }}>
      {icon && icon({ width: s.f + 3, height: s.f + 3, style: { flex: "0 0 auto" } })}
      {children}
      {iconRight && iconRight({ width: s.f + 3, height: s.f + 3, style: { flex: "0 0 auto" } })}
    </button>
  );
}

// ── Pill / Badge ─────────────────────────────────────────────
export function Pill({ children, tone = "neutral", icon, style = {} }: { children?: ReactNode; tone?: string; icon?: IconFn; style?: CSSProperties }) {
  const tones: Record<string, { bg: string; fg: string; bd: string }> = {
    neutral: { bg: T.paper, fg: T.ink2, bd: T.line },
    clay: { bg: T.claySoft, fg: T.clayDeep, bd: "transparent" },
    green: { bg: T.greenSoft, fg: T.green, bd: "transparent" },
    gold: { bg: T.goldSoft, fg: T.gold, bd: "transparent" },
    blue: { bg: T.blueSoft, fg: T.blue, bd: "transparent" },
    red: { bg: T.redSoft, fg: T.red, bd: "transparent" },
    dark: { bg: T.ink, fg: T.paper, bd: "transparent" },
  };
  const c = tones[tone] || tones.neutral;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, background: c.bg, color: c.fg, border: "1px solid " + c.bd, fontFamily: T.sans, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", ...style }}>
      {icon && icon({ width: 13, height: 13, style: { flex: "0 0 auto" } })}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, string> = {
  PENDING: "gold", CONFIRMED: "blue", AWAITING_PAYMENT: "clay", PAID: "green",
  CANCELLED: "red", EXPIRED: "neutral", APPROVED: "green", REJECTED: "red",
  UNDER_REVIEW: "blue", VERIFIED: "green", UNVERIFIED: "gold", SUSPENDED: "red",
  PASS: "green", REVIEW: "gold", FAIL: "red",
};
export function StatusBadge({ status, style }: { status: string; style?: CSSProperties }) {
  return <Pill tone={STATUS_TONE[status] || "neutral"} style={style}>{String(status).replace(/_/g, " ")}</Pill>;
}

// ── Avatar ───────────────────────────────────────────────────
export function Avatar({ landlord, size = 38, ring = "#fff" }: { landlord: string | { color?: string; initials?: string }; size?: number; ring?: string }) {
  const l = typeof landlord === "string" ? landlordById(landlord) : landlord;
  return (
    <div style={{ width: size, height: size, borderRadius: 999, background: l?.color || T.ink2, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.sans, fontWeight: 700, fontSize: size * 0.36, border: `2px solid ${ring}`, flex: "0 0 auto" }}>
      {l?.initials || "?"}
    </div>
  );
}

// ── Form fields ──────────────────────────────────────────────
export function Field({ label, children, hint, style }: { label?: string; children?: ReactNode; hint?: string; style?: CSSProperties }) {
  return (
    <label style={{ display: "block", ...style }}>
      {label && <div style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, color: T.ink2, marginBottom: 7, letterSpacing: ".01em" }}>{label}</div>}
      {children}
      {hint && <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3, marginTop: 6 }}>{hint}</div>}
    </label>
  );
}
export const inputStyle: CSSProperties = {
  width: "100%", fontFamily: T.sans, fontSize: 14.5, color: T.ink, background: "#fff",
  border: "1px solid " + T.line, borderRadius: 11, padding: "12px 14px", outline: "none", boxSizing: "border-box",
};
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }}
    onFocus={(e) => { e.target.style.borderColor = T.clay; e.target.style.boxShadow = "0 0 0 3px " + T.claySoft; props.onFocus?.(e); }}
    onBlur={(e) => { e.target.style.borderColor = T.line; e.target.style.boxShadow = "none"; props.onBlur?.(e); }} />;
}
export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inputStyle, appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236B6153' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: 38, cursor: "pointer", ...(props.style || {}) }}>{children}</select>;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...inputStyle, resize: "vertical", minHeight: 96, lineHeight: 1.5, ...(props.style || {}) }}
    onFocus={(e) => { e.target.style.borderColor = T.clay; e.target.style.boxShadow = "0 0 0 3px " + T.claySoft; }}
    onBlur={(e) => { e.target.style.borderColor = T.line; e.target.style.boxShadow = "none"; }} />;
}

// ── Card ─────────────────────────────────────────────────────
export function Card({ children, pad = 22, style = {}, hover, onClick }: { children?: ReactNode; pad?: number; style?: CSSProperties; hover?: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ background: T.card, border: "1px solid " + T.line, borderRadius: "var(--rh-radius, 18px)", padding: pad, boxShadow: "0 1px 2px rgba(33,29,24,.04)", cursor: onClick ? "pointer" : "default", transition: "box-shadow .18s, transform .18s", ...style }}
      onMouseEnter={hover ? (e) => { e.currentTarget.style.boxShadow = "0 18px 40px -28px rgba(33,29,24,.5)"; e.currentTarget.style.transform = "translateY(-2px)"; } : undefined}
      onMouseLeave={hover ? (e) => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(33,29,24,.04)"; e.currentTarget.style.transform = "translateY(0)"; } : undefined}>
      {children}
    </div>
  );
}

// ── Section heading ──────────────────────────────────────────
export function SectionHead({ eyebrow, title, action, mobile }: { eyebrow?: string; title: string; action?: ReactNode; mobile?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: mobile ? 22 : 32, flexWrap: "wrap" }}>
      <div>
        {eyebrow && <div style={{ color: T.clay, fontSize: 12.5, fontWeight: 700, letterSpacing: ".06em", marginBottom: 8, fontFamily: T.sans, textTransform: "uppercase" }}>{eyebrow}</div>}
        <h2 style={{ margin: 0, fontFamily: T.serif, fontWeight: 400, fontSize: mobile ? 30 : 42, letterSpacing: "-.02em", color: T.ink, lineHeight: 1.05 }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ── Property card ────────────────────────────────────────────
export function PropertyCard({ l, mobile, onClick }: { l: Listing & { image?: string | null }; mobile?: boolean; onClick?: () => void }) {
  return (
    <Card pad={0} hover onClick={onClick} style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", height: mobile ? 168 : 188 }}>
        {l.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.image} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Photo from={l.from} to={l.to} label={l.area} />
        )}
        <span style={{ position: "absolute", top: 12, left: 12 }}>
          <Pill tone="green" icon={I.shield} style={{ background: "rgba(255,255,255,.95)", backdropFilter: "blur(3px)" }}>Verified</Pill>
        </span>
        <span style={{ position: "absolute", top: 12, right: 12, width: 34, height: 34, borderRadius: 999, background: "rgba(255,255,255,.9)", display: "flex", alignItems: "center", justifyContent: "center", color: T.ink2 }}>{I.heart({ width: 17, height: 17 })}</span>
      </div>
      <div style={{ padding: mobile ? 16 : 19, display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.ink2, fontFamily: T.sans, fontSize: 12.5, marginBottom: 6 }}>
          {I.pin({ width: 13, height: 13, style: { flex: "0 0 auto" } })}{l.area} · {l.dist} km to gate
        </div>
        <h3 style={{ margin: 0, fontFamily: T.serif, fontWeight: 500, fontSize: mobile ? 19 : 21, color: T.ink, letterSpacing: "-.01em", lineHeight: 1.15 }}>{l.title}</h3>
        <div style={{ display: "flex", gap: 14, marginTop: 11, color: T.ink2, fontFamily: T.sans, fontSize: 12.5 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>{I.bed({ width: 14, height: 14 })}{l.type}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>{I.ruler({ width: 14, height: 14 })}{l.sqm} m²</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {l.amenities.slice(0, 3).map((a) => (
            <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: T.sans, fontSize: 11.5, color: T.ink2, background: T.paper, padding: "4px 9px", borderRadius: 999 }}>
              {amenityIcon(a, { width: 12, height: 12 })}{a}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto", paddingTop: 15, borderTop: "1px solid " + T.line2, gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontFamily: T.serif, fontSize: mobile ? 22 : 25, fontWeight: 600, color: T.ink }}>{naira(l.price)}</span>
            <span style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink2 }}> /year</span>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: T.sans, fontSize: 12.5, color: T.ink2, flex: "0 0 auto" }}>
            {I.star({ width: 13, height: 13, style: { color: T.gold } })}{l.rating}
          </span>
        </div>
      </div>
    </Card>
  );
}

// ── Campus picker ────────────────────────────────────────────
export function CampusPicker() {
  const { campus, setCampus, showToast } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setOpen((o) => !o)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 999, border: "1px solid " + T.line, background: "#fff", cursor: "pointer", fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.ink, whiteSpace: "nowrap" }}>
        {I.pin({ width: 14, height: 14, style: { color: T.clay, flex: "0 0 auto" } })}
        {campus.short}
        <span style={{ width: 6, height: 6, borderRadius: 999, background: T.green }} />
        {I.chevDown({ width: 14, height: 14, style: { color: T.ink2 } })}
      </div>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 91, background: "#fff", border: "1px solid " + T.line, borderRadius: 16, boxShadow: "0 24px 50px -20px rgba(33,29,24,.35)", padding: 8, width: 270 }}>
            <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: T.ink3, padding: "8px 10px 6px" }}>Choose your campus</div>
            {CAMPUSES.map((c) => (
              <div key={c.id} onClick={() => { if (c.live) { setCampus(c.id); setOpen(false); showToast("Now browsing " + c.short); } else { showToast(c.short + " is launching soon — join the waitlist"); } }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 10, cursor: "pointer", background: campus.id === c.id ? T.claySoft : "transparent" }}>
                <span style={{ color: c.live ? T.clay : T.ink3, flex: "0 0 auto" }}>{I.pin({ width: 15, height: 15 })}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: c.live ? T.ink : T.ink2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                </div>
                {c.live ? <Pill tone="green">Live</Pill> : <span style={{ fontFamily: T.sans, fontSize: 11, color: T.ink3 }}>Soon</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Public nav ───────────────────────────────────────────────
export function PublicNav() {
  const { go, role } = useApp();
  const { mobile: m } = useViewport();
  const [open, setOpen] = useState(false);
  const links: [string, string][] = [["Browse", "search"], ["How it works", "how-it-works"], ["For landlords", "landlord-info"]];
  const dash = role === "student" ? "student" : role === "landlord" ? "landlord" : role === "admin" ? "admin" : null;
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 60, background: "rgba(244,238,228,.88)", backdropFilter: "blur(10px)", borderBottom: "1px solid " + T.line2 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: m ? "14px 20px" : "18px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div onClick={() => go("home")} style={{ cursor: "pointer" }}><Logo size={m ? 25 : 28} fontSize={m ? 20 : 23} /></div>
          {!m && <CampusPicker />}
        </div>
        {!m ? (
          <div style={{ display: "flex", alignItems: "center", gap: 30, fontFamily: T.sans, fontSize: 14.5, color: T.ink2, whiteSpace: "nowrap" }}>
            {links.map(([t, r]) => <span key={t} onClick={() => go(r)} style={{ cursor: "pointer" }}>{t}</span>)}
            {dash
              ? <Button size="sm" variant="dark" onClick={() => go(dash)} icon={I.grid}>Dashboard</Button>
              : <>
                  <span onClick={() => go("login")} style={{ cursor: "pointer", color: T.ink, fontWeight: 600 }}>Sign in</span>
                  <Button size="sm" variant="dark" onClick={() => go("register")}>List a property</Button>
                </>}
          </div>
        ) : (
          <div onClick={() => setOpen((o) => !o)} style={{ cursor: "pointer", color: T.ink }}>{open ? I.x({ width: 24, height: 24 }) : I.menu({ width: 24, height: 24 })}</div>
        )}
      </div>
      {m && open && (
        <div style={{ padding: "8px 20px 18px", display: "flex", flexDirection: "column", gap: 4, borderTop: "1px solid " + T.line2 }}>
          <div style={{ padding: "6px 0 12px" }}><CampusPicker /></div>
          {links.map(([t, r]) => <div key={t} onClick={() => { go(r); setOpen(false); }} style={{ padding: "11px 4px", fontFamily: T.sans, fontSize: 16, color: T.ink, cursor: "pointer" }}>{t}</div>)}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            {dash ? <Button full variant="dark" onClick={() => { go(dash); setOpen(false); }}>Dashboard</Button>
              : <>
                  <Button full variant="outline" onClick={() => { go("login"); setOpen(false); }}>Sign in</Button>
                  <Button full variant="dark" onClick={() => { go("register"); setOpen(false); }}>List property</Button>
                </>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────────
export function Footer() {
  const { go } = useApp();
  const { mobile: m } = useViewport();
  const cols: [string, [string, string][]][] = [
    ["Explore", [["Browse homes", "search"], ["How it works", "how-it-works"], ["Safety & trust", "safety"]]],
    ["Landlords", [["List a property", "add-property"], ["Get verified", "landlord-verification"], ["Earnings", "landlord"]]],
    ["Company", [["About RentalHub", "about"], ["Help centre", "help"], ["Privacy", "privacy"], ["Terms", "terms"]]],
  ];
  return (
    <div style={{ background: T.card, color: T.ink, padding: m ? "40px 20px 30px" : "60px 40px 40px", borderTop: "1px solid " + T.line }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: m ? "1fr" : "1.4fr 1fr 1fr 1fr", gap: m ? 30 : 40 }}>
        <div>
          <Logo />
          <p style={{ fontFamily: T.sans, fontSize: 14, color: T.ink2, lineHeight: 1.6, marginTop: 16, maxWidth: 280 }}>
            Verified off-campus housing for Nigerian students. No agents, no scams — just real homes you can trust.
          </p>
        </div>
        {cols.map(([h, items]) => (
          <div key={h}>
            <div style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: T.ink3, marginBottom: 16 }}>{h}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {items.map(([t, r]) => <span key={t} onClick={() => go(r)} style={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink2, cursor: "pointer" }}>{t}</span>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1280, margin: "36px auto 0", paddingTop: 22, borderTop: "1px solid " + T.line2, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontFamily: T.sans, fontSize: 13, color: T.ink3 }}>
        <span>© 2026 RentalHub — a product of <span style={{ color: T.ink2, fontWeight: 600 }}>Mikaelson Initiative</span>.</span>
        <span style={{ display: "flex", gap: 20 }}><span onClick={() => go("privacy")} style={{ cursor: "pointer" }}>Privacy</span><span onClick={() => go("terms")} style={{ cursor: "pointer" }}>Terms</span></span>
      </div>
    </div>
  );
}
