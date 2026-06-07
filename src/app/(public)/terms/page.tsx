"use client";

import { LegalPage } from "@/components/rh/status-page";

export default function TermsPage() {
  return <LegalPage title="Terms of Service" updated="June 2026" sections={[
    ["Acceptance of terms", ["By creating an account or using RentalHub, you agree to these terms. If you do not agree, please do not use the platform. RentalHub is operated by Mikaelson Initiative."]],
    ["Eligibility", ["You must be at least 18 years old and able to enter a binding agreement. Students should use a valid school email where possible; landlords must complete identity and ownership verification before listing."]],
    ["Listings & verification", ["Every listing is reviewed by our admin team before it goes live. Landlords are responsible for the accuracy of their listings; misleading or fraudulent listings are removed and may result in account suspension."]],
    ["Bookings & payments", ["When you book, you make an offer that the landlord may accept. On acceptance, you sign the tenancy agreement and pay through RentalHub. We hold funds securely and release them to the landlord only after you confirm move-in."]],
    ["Fees & refunds", ["The rent shown is what you pay — we do not charge students hidden agency fees. Caution fees, where applicable, are refundable after a satisfactory end-of-tenancy inspection, subject to the agreement."]],
    ["Conduct", ["Treat landlords, tenants and staff with respect. Do not attempt to take transactions off-platform to avoid protections — doing so removes our ability to safeguard your money."]],
    ["Limitation of liability", ["RentalHub facilitates connections and payments between students and landlords. While we verify listings and identities, you remain responsible for inspecting a property and satisfying yourself before confirming move-in."]],
    ["Changes to these terms", ["We may update these terms from time to time. We’ll notify you of material changes, and continued use of the platform means you accept the updated terms."]],
  ]} />;
}
