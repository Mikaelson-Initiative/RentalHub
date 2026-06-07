/**
 * theme.tsx — RentalHub "Editorial House" design language (ported from the
 * Claude Design handoff). Palette tokens, currency helpers, icon set, photo
 * placeholder, and the logo mark. Accent/radius/serif are CSS-var driven
 * (defaults set in globals.css) so the whole UI can be retuned in one place.
 *
 * No hooks here — safe to import from server or client components.
 */
import type { CSSProperties, SVGProps } from "react";

export const T = {
  // surfaces
  paper: "#F4EEE4",
  paper2: "#EBE2D3",
  paper3: "#E2D7C4",
  card: "#FFFFFF",
  ink: "#211D18",
  ink2: "#6B6153",
  ink3: "#9A9082",
  // brand (CSS-var driven)
  clay: "var(--rh-accent, #C75B2A)",
  clayDeep: "var(--rh-accent-deep, #A8451B)",
  claySoft: "var(--rh-accent-soft, #F4E2D6)",
  // states
  green: "#1A7A4A",
  greenSoft: "#E2EFE6",
  gold: "#B8862F",
  goldSoft: "#F6ECD4",
  blue: "#3C5A86",
  blueSoft: "#E4EAF2",
  red: "#B23B2E",
  redSoft: "#F6E2DE",
  line: "rgba(33,29,24,.12)",
  line2: "rgba(33,29,24,.07)",
  // type (CSS-var driven; defaults to Hanken Grotesk via globals.css)
  serif: 'var(--rh-serif, "Hanken Grotesk", system-ui, -apple-system, sans-serif)',
  sans: 'var(--rh-sans, "Hanken Grotesk", system-ui, -apple-system, sans-serif)',
} as const;

export function naira(n: number | string): string {
  return "₦" + Number(n).toLocaleString("en-NG");
}
export function shortNaira(n: number): string {
  if (n >= 1000) return "₦" + n / 1000 + "k";
  return "₦" + n;
}

type IconProps = SVGProps<SVGSVGElement>;
const stroke: IconProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const I: Record<string, (p?: IconProps) => React.ReactElement> = {
  pin: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>,
  check: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M20 6 9 17l-5-5" /></svg>,
  checkCircle: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>,
  shield: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>,
  shieldAlert: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>,
  star: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="m12 2 3 6.5 7 .9-5 4.8 1.3 7L12 18l-6.6 3.2L6.7 14l-5-4.8 7-.9L12 2Z" /></svg>,
  search: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>,
  arrow: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  arrowLeft: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>,
  bolt: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" /></svg>,
  drop: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M12 2.5S5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.5 12 2.5Z" /></svg>,
  car: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M5 13 6.5 8h11L19 13" /><path d="M3 17v-2.5C3 13.7 3.7 13 5 13h14c1.3 0 2 .7 2 1.5V17" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /></svg>,
  wifi: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M5 12.5a10 10 0 0 1 14 0M8 16a5 5 0 0 1 8 0" /><circle cx="12" cy="19.5" r="1" /></svg>,
  sun: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>,
  bed: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M3 7v11M3 13h18v5M21 13v-2a3 3 0 0 0-3-3h-7v5" /><circle cx="7" cy="10.5" r="1.6" /></svg>,
  ruler: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M3 9h18v6H3zM7 9v3M11 9v4M15 9v3M19 9v4" /></svg>,
  home: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></svg>,
  user: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>,
  users: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.4 3-5 6.5-5s6.5 1.6 6.5 5" /><path d="M16 5.2A3.2 3.2 0 0 1 16 11M21.5 20c0-2.6-1.6-4.2-4-4.8" /></svg>,
  phone: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M6.5 3h3l1.5 5-2 1.5a13 13 0 0 0 5.5 5.5l1.5-2 5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5a2 2 0 0 1 2-2Z" /></svg>,
  calendar: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v3M16 3v3" /></svg>,
  doc: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>,
  clock: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  wallet: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M3 7a2 2 0 0 1 2-2h12v4M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5" /><circle cx="17" cy="13" r="1.3" /></svg>,
  chart: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M3 3v18h18" /><path d="M7 14l3-3 3 2 5-6" /></svg>,
  plus: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M12 5v14M5 12h14" /></svg>,
  x: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>,
  menu: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M3 6h18M3 12h18M3 18h18" /></svg>,
  chevDown: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="m6 9 6 6 6-6" /></svg>,
  chevRight: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="m9 6 6 6-6 6" /></svg>,
  heart: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M12 20s-7-4.3-9.5-8.6C1 8.5 2.4 5 5.8 5 8 5 10 6.5 12 9c2-2.5 4-4 6.2-4 3.4 0 4.8 3.5 3.3 6.4C19 15.7 12 20 12 20Z" /></svg>,
  filter: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M3 5h18l-7 8v6l-4 1v-7Z" /></svg>,
  sparkle: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>,
  logout: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>,
  upload: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>,
  eye: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>,
  lock: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>,
  mail: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>,
  grid: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  inbox: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M3 13h5l1.5 3h5L21 13M3 13l3-8h12l3 8M3 13v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" /></svg>,
  building: (p) => <svg viewBox="0 0 24 24" {...stroke} {...p}><path d="M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17M15 21V9h4a1 1 0 0 1 1 1v11M8 7h3M8 11h3M8 15h3" /></svg>,
};

export function amenityIcon(name: string, props?: IconProps): React.ReactElement {
  const l = (name || "").toLowerCase();
  if (l.includes("wifi") || l.includes("internet")) return I.wifi(props);
  if (l.includes("solar")) return I.sun(props);
  if (l.includes("gen") || l.includes("prepaid") || l.includes("nepa") || l.includes("power") || l.includes("meter")) return I.bolt(props);
  if (l.includes("secur") || l.includes("burglar") || l.includes("gate") || l.includes("fence")) return I.shield(props);
  if (l.includes("water") || l.includes("bore")) return I.drop(props);
  if (l.includes("park") || l.includes("car")) return I.car(props);
  if (l.includes("tile") || l.includes("pop") || l.includes("wardrobe") || l.includes("kitchen")) return I.home(props);
  return I.check(props);
}

export function Photo({
  from = "#cbb89a",
  to = "#8a7355",
  label,
  radius = 0,
  tag = true,
  style = {},
  seed = 0,
}: {
  from?: string;
  to?: string;
  label?: string;
  radius?: number;
  tag?: boolean;
  style?: CSSProperties;
  seed?: number;
}) {
  const tones: [string, string][] = [["#d8c4a0", "#9c8055"], ["#c8bca6", "#7d7158"], ["#cdb89c", "#8a7150"], ["#bcae9a", "#6f6450"], ["#d3bd98", "#897046"], ["#c2b49c", "#776a52"]];
  const [f, t] = from && to ? [from, to] : tones[seed % tones.length];
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: radius, overflow: "hidden", background: `linear-gradient(135deg, ${f} 0%, ${t} 100%)`, ...style }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(200deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,0) 40%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,.22) 0%, rgba(0,0,0,0) 55%)" }} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <g fill="none" stroke="rgba(0,0,0,.32)" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" opacity="0.5">
          <path d="M22 58 L50 38 L78 58" /><path d="M30 54 V80 H70 V54" />
          <rect x="44" y="64" width="12" height="16" /><rect x="34" y="60" width="7" height="7" /><rect x="59" y="60" width="7" height="7" />
        </g>
      </svg>
      {tag && label && (
        <span style={{ position: "absolute", bottom: 9, right: 9, fontSize: 9.5, letterSpacing: ".1em", fontWeight: 600, textTransform: "uppercase", color: "rgba(255,255,255,.9)", background: "rgba(0,0,0,.3)", padding: "3px 8px", borderRadius: 4, fontFamily: T.sans }}>{label}</span>
      )}
    </div>
  );
}

export function Mark({ size = 28, color = T.clay, ink = T.ink }: { size?: number; color?: string; ink?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ flex: "0 0 auto" }}>
      <path d="M9 24 L24 11 L39 24" stroke={color} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 22 V38 H34 V22" stroke={ink} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="29" r="3.4" stroke={color} strokeWidth="3" />
      <path d="M24 32 V40" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ size = 28, fontSize = 23, ink = T.ink, color = T.clay }: { size?: number; fontSize?: number; ink?: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <Mark size={size} color={color} ink={ink} />
      <span style={{ fontFamily: T.serif, fontWeight: 600, fontSize, letterSpacing: "-.02em", color: ink }}>RentalHub</span>
    </div>
  );
}
