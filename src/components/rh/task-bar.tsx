"use client";

import { T, I, Logo } from "@/lib/rh/theme";
import { useApp } from "@/components/rh/app";

// Minimal focused top bar for task screens (payment, receipt).
export function TaskBar({ backLabel = "Back to bookings", onBack }: { backLabel?: string; onBack?: () => void }) {
  const { go } = useApp();
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(244,238,228,.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid " + T.line2 }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div onClick={() => go("home")} style={{ cursor: "pointer" }}><Logo size={24} fontSize={20} /></div>
        <span onClick={onBack || (() => go("student"))} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: T.sans, fontSize: 13.5, color: T.ink2, cursor: "pointer" }}>{I.arrowLeft({ width: 16, height: 16 })}{backLabel}</span>
      </div>
    </div>
  );
}
