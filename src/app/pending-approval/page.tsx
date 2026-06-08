"use client";

import { T, I } from "@/lib/rh/theme";
import { useApp } from "@/components/rh/app";
import { Button } from "@/components/rh/ui";
import { StatusPage } from "@/components/rh/status-page";

export default function PendingApprovalPage() {
  const { go } = useApp();
  const steps = ["We verify your information within 24–48 hours", "You get an email the moment you’re approved", "Then you can publish your properties to students"];
  return (
    <StatusPage icon={I.clock} tone="gold" title="Account under review"
      actions={<Button size="lg" variant="dark" onClick={() => go("home")}>Back to home</Button>}>
      <p style={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink2, lineHeight: 1.6, marginTop: 12 }}>Thanks for registering as a landlord. Our admin team is reviewing your account to keep RentalHub safe and trustworthy for students.</p>
      <div style={{ background: T.paper, borderRadius: 14, padding: 18, marginTop: 20, textAlign: "left" }}>
        <div style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 700, color: T.ink, marginBottom: 12 }}>What happens next?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", lineHeight: 1.45 }}>
              <span style={{ color: T.green, flex: "0 0 auto", marginTop: 2 }}>{I.checkCircle({ width: 17, height: 17 })}</span>
              <span style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, lineHeight: 1.45 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
      <p style={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink3, marginTop: 18 }}>Questions? <span style={{ color: T.clay, fontWeight: 600 }}>support@rentalhub.ng</span></p>
    </StatusPage>
  );
}
