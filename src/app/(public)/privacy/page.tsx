"use client";

import { LegalPage } from "@/components/rh/status-page";

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" updated="June 2026" sections={[
    ["Who we are", ["RentalHub is a verified student-housing platform operated by Mikaelson Initiative. This policy explains what personal information we collect, how we use it, and the choices you have."]],
    ["Information we collect", ["Account details you provide — name, email, phone number, and school. For landlords, we also collect identity and property-ownership documents needed for verification.", "Usage information such as the listings you view, searches you run, and bookings you make, so we can improve the service and keep it safe."]],
    ["How we use your information", ["To create and manage your account, verify landlords, process bookings and payments, and keep the platform free of fraud and scams.", "To send you essential service messages — booking updates, payment receipts, and security notices. We do not sell your personal data."]],
    ["Payments", ["Payments are processed by our payment partner. We hold rent securely in escrow and release it to the landlord only after you confirm move-in. We store payment references, not full card details."]],
    ["Document verification", ["Landlord identity and ownership documents are reviewed by our admin team and automated checks solely to confirm authenticity. They are stored securely and are never shown to students."]],
    ["Your rights", ["You can access, correct, or delete your personal information at any time from your profile, or by contacting us. You may also request a copy of the data we hold about you."]],
    ["Contact", ["For any privacy request, email privacy@rentalhub.ng and we’ll respond within 30 days."]],
  ]} />;
}
