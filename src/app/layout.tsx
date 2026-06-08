import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { AppProvider } from "@/components/rh/app";

const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-hanken" });

export const metadata: Metadata = {
  metadataBase: new URL("https://rentalhub.ng"),
  applicationName: "RentalHub",
  title: {
    default: "RentalHub - Off-Campus Accommodation for Nigerian Students",
    template: "%s | RentalHub",
  },
  description:
    "Find verified off-campus accommodation for Nigerian students. Browse properties, book rooms, manage your listings, and discover housing near your school.",
  keywords: [
    "student accommodation",
    "off-campus housing",
    "student housing Nigeria",
    "rental",
    "RentalHub",
    "Nigerian students",
    "university housing",
  ],
  authors: [{ name: "RentalHub" }],
  alternates: {
    canonical: "https://rentalhub.ng",
  },
  verification: {
    google: "CyGGGZptjbYyyiMNb0mi9frcF1QKDTWZm2rYwfNXD_o",
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: [{ url: "/icon.png" }],
    apple: [{ url: "/icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://rentalhub.ng",
    siteName: "RentalHub",
    title: "RentalHub - Off-Campus Accommodation for Nigerian Students",
    description:
      "Find verified off-campus accommodation for Nigerian students. Browse properties, book rooms, and manage your listings.",
    images: [
      {
        url: "https://rentalhub.ng/icon.png",
        width: 200,
        height: 200,
        alt: "RentalHub Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RentalHub - Off-Campus Accommodation for Nigerian Students",
    description:
      "Find verified off-campus accommodation for Nigerian students.",
    images: ["https://rentalhub.ng/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RentalHub",
    url: "https://rentalhub.ng",
    logo: "https://rentalhub.ng/favicon-512.png",
  };

  return (
    <html lang="en" className={hanken.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="overflow-x-hidden">
        <Providers>
          <AppProvider>{children}</AppProvider>
        </Providers>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
