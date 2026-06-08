"use client";

import type { ReactNode } from "react";
import { T, I, Photo, Logo } from "@/lib/rh/theme";
import { useApp } from "@/components/rh/app";
import { Pill } from "@/components/rh/ui";

// Split layout: left editorial brand panel, right form. Shared by all auth pages.
export function AuthShell({ children, title, sub, mobile }: { children: ReactNode; title: string; sub?: string; mobile: boolean }) {
  const { go } = useApp();
  return (
    <div style={{ minHeight: "100vh", background: T.paper, display: mobile ? "block" : "grid", gridTemplateColumns: "1fr 1.05fr" }}>
      {!mobile && (
        <div style={{ position: "relative", overflow: "hidden", padding: 48, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ position: "absolute", inset: 0 }}><Photo from="#b89668" to="#5e4730" tag={false} /></div>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(33,29,24,.45), rgba(33,29,24,.78))" }} />
          <div style={{ position: "relative" }}><div onClick={() => go("home")} style={{ cursor: "pointer" }}><Logo ink="#fff" color="#fff" /></div></div>
          <div style={{ position: "relative" }}>
            <span style={{ display: "inline-flex" }}><Pill tone="dark" icon={I.shield} style={{ background: "rgba(255,255,255,.16)", color: "#fff", backdropFilter: "blur(4px)" }}>Verified housing</Pill></span>
            <h2 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 44, color: "#fff", letterSpacing: "-.02em", lineHeight: 1.05, margin: "18px 0 0" }}>
              Your campus home,<br />without the worry.
            </h2>
            <p style={{ fontFamily: T.sans, fontSize: 15.5, color: "rgba(255,255,255,.82)", lineHeight: 1.6, marginTop: 16, maxWidth: 380 }}>
              Join students across Nigeria finding verified homes near campus — and pay safely, with money held until you move in.
            </p>
          </div>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: mobile ? "32px 22px 48px" : "48px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {mobile && <div onClick={() => go("home")} style={{ cursor: "pointer", marginBottom: 28 }}><Logo /></div>}
          <h1 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: mobile ? 32 : 38, letterSpacing: "-.02em", color: T.ink, margin: 0, lineHeight: 1.05 }}>{title}</h1>
          {sub && <p style={{ fontFamily: T.sans, fontSize: 15, color: T.ink2, marginTop: 10, lineHeight: 1.5 }}>{sub}</p>}
          <div style={{ marginTop: 26 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
