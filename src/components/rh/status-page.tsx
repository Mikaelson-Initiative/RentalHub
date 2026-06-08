"use client";

import type { ReactElement, ReactNode } from "react";
import { T, Logo } from "@/lib/rh/theme";
import { useApp, useViewport } from "@/components/rh/app";
import { Pill, Card, PublicNav, Footer } from "@/components/rh/ui";

type IconFn = (p?: Record<string, unknown>) => ReactElement;

export function StatusPage({ icon, tone = "clay", title, children, actions }: { icon: IconFn; tone?: "clay" | "gold" | "red" | "green"; title: string; children?: ReactNode; actions?: ReactNode }) {
  const { go } = useApp();
  const { mobile } = useViewport();
  const tones = { clay: [T.claySoft, T.clay], gold: [T.goldSoft, T.gold], red: [T.redSoft, T.red], green: [T.greenSoft, T.green] };
  const [soft, fg] = tones[tone];
  return (
    <div style={{ minHeight: "100vh", background: T.paper, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: mobile ? "18px 22px" : "22px 40px" }}><div onClick={() => go("home")} style={{ cursor: "pointer", display: "inline-block" }}><Logo /></div></div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: mobile ? "20px 22px 60px" : "20px 40px 80px" }}>
        <Card pad={mobile ? 28 : 40} style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ width: 76, height: 76, borderRadius: 999, background: soft, color: fg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>{icon({ width: 36, height: 36 })}</div>
          <h1 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: mobile ? 28 : 34, letterSpacing: "-.02em", color: T.ink, margin: 0, lineHeight: 1.08 }}>{title}</h1>
          {children}
          {actions && <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 26 }}>{actions}</div>}
        </Card>
      </div>
    </div>
  );
}

export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: [string, string[]][] }) {
  const { mobile } = useViewport();
  return (
    <div style={{ background: T.paper, minHeight: "100vh" }}>
      <PublicNav />
      <div style={{ background: T.paper2, borderBottom: "1px solid " + T.line2 }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: mobile ? "34px 22px" : "56px 40px" }}>
          <Pill tone="clay">Legal</Pill>
          <h1 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: mobile ? 36 : 56, letterSpacing: "-.02em", color: T.ink, margin: "14px 0 0", lineHeight: 1 }}>{title}</h1>
          <p style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, marginTop: 12 }}>Last updated {updated}</p>
        </div>
      </div>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: mobile ? "32px 22px 56px" : "52px 40px 72px" }}>
        {sections.map(([h, body], i) => (
          <div key={i} style={{ marginBottom: 34 }}>
            <h2 style={{ fontFamily: T.serif, fontWeight: 500, fontSize: mobile ? 22 : 26, color: T.ink, margin: "0 0 12px", letterSpacing: "-.01em" }}>{i + 1}. {h}</h2>
            {body.map((para, j) => <p key={j} style={{ fontFamily: T.sans, fontSize: 15, color: T.ink2, lineHeight: 1.7, margin: "0 0 12px" }}>{para}</p>)}
          </div>
        ))}
        <div style={{ borderTop: "1px solid " + T.line, paddingTop: 22, fontFamily: T.sans, fontSize: 13.5, color: T.ink3 }}>
          Questions about this policy? Contact <span style={{ color: T.clay, fontWeight: 600 }}>legal@rentalhub.ng</span>. RentalHub is a product of Mikaelson Initiative.
        </div>
      </div>
      <Footer />
    </div>
  );
}
