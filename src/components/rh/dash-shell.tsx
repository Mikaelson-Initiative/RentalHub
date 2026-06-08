"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { T, I, Logo } from "@/lib/rh/theme";
import { useApp, useViewport } from "@/components/rh/app";
import { Avatar, Card } from "@/components/rh/ui";

type IconFn = (p?: Record<string, unknown>) => ReactElement;

const NAVS: Record<string, { label: string; who: { name: string; initials: string; color: string }; items: [string, string, IconFn][] }> = {
  student: { label: "Student", who: { name: "Chioma Eze", initials: "CE", color: "#3C5A86" }, items: [
    ["home", "Browse homes", I.search], ["bookings", "My bookings", I.inbox], ["saved", "Saved", I.heart], ["profile", "Profile", I.user],
  ] },
  landlord: { label: "Landlord", who: { name: "Adebayo Ogunleye", initials: "AO", color: "#2F5D4F" }, items: [
    ["listings", "My listings", I.building], ["requests", "Tenant requests", I.inbox], ["earnings", "Earnings", I.wallet], ["verification", "Verification", I.shield], ["profile", "Profile", I.user],
  ] },
  admin: { label: "Admin", who: { name: "RentalHub Admin", initials: "RH", color: "#A8451B" }, items: [
    ["pending", "Pending approvals", I.clock], ["properties", "All properties", I.building], ["verifications", "Verifications", I.shield], ["payouts", "Payouts", I.wallet], ["users", "Users", I.users], ["forecast", "Demand (AI)", I.chart],
  ] },
};

export function DashShell({ role, tab, setTab, title, subtitle, action, children, badges = {} }: {
  role: "student" | "landlord" | "admin"; tab: string; setTab: (t: string) => void; title: string; subtitle?: string;
  action?: ReactNode; children: ReactNode; badges?: Record<string, number | undefined>;
}) {
  const { go, showToast, signOut } = useApp();
  const { mobile, tablet } = useViewport();
  const [open, setOpen] = useState(false);
  const cfg = NAVS[role];
  const compact = mobile || tablet;

  const Sidebar = ({ inSheet }: { inSheet?: boolean }) => (
    <div style={{ width: 248, flex: "0 0 248px", background: T.ink, color: T.paper, minHeight: inSheet ? "auto" : "100vh", display: "flex", flexDirection: "column", position: inSheet ? "static" : "sticky", top: 0, height: inSheet ? "auto" : "100vh" }}>
      <div style={{ padding: "22px 22px 18px" }}>
        <div onClick={() => go("home")} style={{ cursor: "pointer" }}><Logo ink={T.paper} color={T.clay} fontSize={21} size={26} /></div>
      </div>
      <div style={{ padding: "4px 14px", flex: 1 }}>
        <div style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(244,238,228,.4)", padding: "8px 10px 10px" }}>{cfg.label} workspace</div>
        {cfg.items.map(([key, label, Ic]) => {
          const active = tab === key;
          return (
            <div key={key} onClick={() => { setTab(key); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", borderRadius: 11, cursor: "pointer", background: active ? "rgba(199,91,42,.18)" : "transparent", color: active ? "#fff" : "rgba(244,238,228,.72)", marginBottom: 2, fontFamily: T.sans, fontSize: 14, fontWeight: active ? 600 : 500, position: "relative" }}>
              {active && <span style={{ position: "absolute", left: -14, top: 10, bottom: 10, width: 3, background: T.clay, borderRadius: 3 }} />}
              <span style={{ color: active ? T.clay : "rgba(244,238,228,.6)" }}>{Ic({ width: 18, height: 18 })}</span>{label}
              {badges[key] ? <span style={{ marginLeft: "auto", background: T.clay, color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 999, minWidth: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>{badges[key]}</span> : null}
            </div>
          );
        })}
      </div>
      <div style={{ padding: 14, borderTop: "1px solid rgba(244,238,228,.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px" }}>
          <Avatar landlord={cfg.who} size={36} ring="rgba(244,238,228,.2)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cfg.who.name}</div>
            <div style={{ fontFamily: T.sans, fontSize: 11.5, color: "rgba(244,238,228,.5)" }}>{cfg.label} account</div>
          </div>
          <span onClick={() => { showToast("Signed out"); signOut(); }} style={{ cursor: "pointer", color: "rgba(244,238,228,.6)" }}>{I.logout({ width: 18, height: 18 })}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", background: T.paper, minHeight: "100vh" }}>
      {!compact && <Sidebar />}
      {compact && open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(33,29,24,.5)" }} onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ height: "100%", width: 248, overflowY: "auto" }}><Sidebar inSheet /></div>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(244,238,228,.9)", backdropFilter: "blur(8px)", borderBottom: "1px solid " + T.line2, padding: compact ? "14px 20px" : "18px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
            {compact && <span onClick={() => setOpen(true)} style={{ cursor: "pointer", color: T.ink, flex: "0 0 auto" }}>{I.menu({ width: 24, height: 24 })}</span>}
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontFamily: T.serif, fontWeight: 400, fontSize: compact ? 24 : 32, letterSpacing: "-.02em", color: T.ink, lineHeight: 1.1, whiteSpace: "nowrap" }}>{title}</h1>
              {subtitle && !compact && <p style={{ margin: "3px 0 0", fontFamily: T.sans, fontSize: 13.5, color: T.ink2 }}>{subtitle}</p>}
            </div>
          </div>
          {action && <div style={{ flex: "0 0 auto" }}>{action}</div>}
        </div>
        <div style={{ padding: compact ? "20px" : "28px 36px 48px" }}>{children}</div>
      </div>
    </div>
  );
}

export function Stat({ label, value, tone = "ink", icon, active, onClick, sub }: { label: string; value: ReactNode; tone?: "ink" | "clay" | "green" | "gold" | "blue" | "red"; icon?: IconFn; active?: boolean; onClick?: () => void; sub?: string }) {
  const colors = { ink: T.ink, clay: T.clay, green: T.green, gold: T.gold, blue: T.blue, red: T.red };
  return (
    <Card pad={20} onClick={onClick} hover={!!onClick} style={{ outline: active ? `2px solid ${T.clay}` : "none", outlineOffset: -1 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ fontFamily: T.serif, fontSize: 34, fontWeight: 600, color: colors[tone], lineHeight: 1 }}>{value}</div>
        {icon && <span style={{ color: T.ink3 }}>{icon({ width: 19, height: 19 })}</span>}
      </div>
      <div style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, marginTop: 8 }}>{label}</div>
      {sub && <div style={{ fontFamily: T.sans, fontSize: 11.5, color: T.ink3, marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}

export function EmptyState({ icon, title, sub, action }: { icon?: IconFn; title: string; sub?: string; action?: ReactNode }) {
  return (
    <Card pad={48} style={{ textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: T.paper, color: T.ink3, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>{(icon || I.inbox)({ width: 26, height: 26 })}</div>
      <div style={{ fontFamily: T.serif, fontSize: 24, color: T.ink }}>{title}</div>
      {sub && <p style={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink2, marginTop: 8 }}>{sub}</p>}
      {action && <div style={{ marginTop: 18, display: "inline-block" }}>{action}</div>}
    </Card>
  );
}
