import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import FAQAccordion from "@/components/FAQAccordion";
import FloatingCTA from "@/components/FloatingCTA";
import HeroSlideshow from "@/components/HeroSlideshow";
import { Building2 } from "lucide-react";

export const revalidate = 3600; // ISR: cache for 1 hour, revalidate on-demand via API

export const metadata: Metadata = {
  title: "Verified Off-Campus Accommodation in Nigeria",
  description:
    "Browse verified off-campus apartments, self-contains, and rooms for students across Nigeria. Book directly with trusted landlords — no agent fees.",
  openGraph: {
    title: "RentalHub — Verified Off-Campus Accommodation in Nigeria",
    description:
      "Browse verified off-campus apartments, self-contains, and rooms for students across Nigeria. Book directly with trusted landlords — no agent fees.",
    url: "https://rentalhub.ng",
  },
};
import {
  MapPin,
  Zap,
  Shield,
  Droplets,
  Car,
  Wifi,
  Sun,
  CheckCircle,
  ArrowRight,
  Star,
  Home,
  Users,
} from "lucide-react";

// ── Data fetching ─────────────────────────────────────────────
// Listings are served by the backend API (separate repo). Until that is
// wired up, the homepage renders with no featured listings / slideshow.

interface FeaturedProperty {
  id: string;
  title: string;
  price: number;
  distanceToCampus: number | null;
  amenities: string[];
  location: string;
  image: string | null;
}

async function getPageData(): Promise<{
  featured: FeaturedProperty[];
  slideImages: { src: string; alt: string }[];
}> {
  return { featured: [], slideImages: [] };
}

// ── Amenity icon ──────────────────────────────────────────────

function AmenityIcon({ name }: { name: string }) {
  const l = name.toLowerCase();
  if (l.includes("wifi") || l.includes("internet")) return <Wifi className="w-3 h-3" />;
  if (l.includes("generator") || l.includes("prepaid") || l.includes("solar"))
    return l.includes("solar") ? <Sun className="w-3 h-3" /> : <Zap className="w-3 h-3" />;
  if (l.includes("security") || l.includes("watchman") || l.includes("burglar"))
    return <Shield className="w-3 h-3" />;
  if (l.includes("water") || l.includes("borehole") || l.includes("well"))
    return <Droplets className="w-3 h-3" />;
  if (l.includes("parking") || l.includes("car")) return <Car className="w-3 h-3" />;
  return <CheckCircle className="w-3 h-3" />;
}

// ── Static data ───────────────────────────────────────────────

const SCHOOLS = [
  { value: "BOUESTI - Ikere-Ekiti", label: "BOUESTI - Ikere-Ekiti" },
  { value: "University of Lagos (UNILAG)", label: "University of Lagos (UNILAG)" },
  { value: "Obafemi Awolowo University (OAU)", label: "OAU - Ile-Ife" },
  { value: "University of Ibadan (UI)", label: "University of Ibadan (UI)" },
  { value: "University of Benin (UNIBEN)", label: "University of Benin (UNIBEN)" },
  { value: "Federal University of Technology Akure (FUTA)", label: "FUTA - Akure" },
  { value: "University of Ilorin (UNILORIN)", label: "University of Ilorin" },
  { value: "Ahmadu Bello University (ABU)", label: "Ahmadu Bello University" },
  { value: "University of Nigeria Nsukka (UNN)", label: "UNN - Nsukka" },
  { value: "Covenant University", label: "Covenant University" },
];

const STUDENT_STEPS = [
  { icon: <Building2 className="w-5 h-5" />, title: "Browse verified listings", desc: "Filter by area, rent range, and distance to campus." },
  { icon: <Star className="w-5 h-5" />, title: "Compare & shortlist", desc: "Review amenities, photos, and landlord profiles side by side." },
  { icon: <CheckCircle className="w-5 h-5" />, title: "Book confidently", desc: "Request a booking and connect directly with the landlord." },
];

const LANDLORD_STEPS = [
  { icon: <Users className="w-5 h-5" />, title: "Create your profile", desc: "Sign up and complete your landlord profile in minutes." },
  { icon: <Home className="w-5 h-5" />, title: "List your property", desc: "Submit your listing — it goes live after a quick admin review." },
  { icon: <Star className="w-5 h-5" />, title: "Get serious tenants", desc: "Connect with verified students actively looking for housing." },
];

const FAQS = [
  { q: "How do I know a listing is real?", a: "Every listing on RentalHub passes a manual admin review before going live. Listings are tied to verified landlord accounts, and our team checks property details for accuracy." },
  { q: "Can landlords list immediately after signup?", a: "Landlords can create their account right away and submit listings instantly. However, each listing only goes live after admin approval — usually within 24 hours." },
  { q: "Can students contact landlords directly?", a: "Yes. Once you find a property you like, you can submit a booking request. The landlord can then confirm or reach out to you directly." },
  { q: "Are there hidden fees?", a: "No. RentalHub is free for students to browse and book. Landlords are not charged listing fees. The rent shown is exactly what you'll pay." },
  { q: "What if I spot a suspicious listing?", a: "Use the Report button on any listing, or contact our support team. Our admin team investigates every report and acts quickly to protect students." },
  { q: "Which areas around BOUESTI are covered?", a: "We currently cover Uro, Odo Oja, Oke'Kere, Afao, Olumilua Area, Ajebandele, Ikoyi Estate, and Amoye Grammar School Area — all within walking or cycling distance of the main gate." },
];

// ── Page ──────────────────────────────────────────────────────

export default async function HomePage() {
  const { featured, slideImages } = await getPageData();

  return (
    <div className="min-h-screen bg-[#fafafa] overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-white to-gray-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#192F59] leading-[0.95] tracking-tight">
                YOUR
                <br />
                CAMPUS
                <br />
                HOME
              </h1>

              <p className="font-sans text-base text-gray-500 mt-6 ml-1">
                Verified off-campus student housing
              </p>

              <form action="/properties" method="GET" className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md">
                <div className="relative flex-1">
                  <select
                    name="school"
                    defaultValue=""
                    className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3.5 font-sans text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#E67E22]/20 focus:border-[#E67E22] cursor-pointer"
                  >
                    <option value="">Select school...</option>
                    {SCHOOLS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-[#E67E22] hover:bg-[#D35400] text-white font-sans text-sm font-semibold px-8 py-3.5 rounded-xl transition-colors whitespace-nowrap"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="relative">
              <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 p-6 lg:p-8">
                <div className="flex flex-wrap gap-2 mb-5">
                  {/* Non-interactive informational badges */}
                  <span className="px-4 py-1.5 border border-gray-200 rounded-full font-sans text-xs text-gray-600 select-none">Verified</span>
                  <span className="px-4 py-1.5 border border-gray-200 rounded-full font-sans text-xs text-gray-600 select-none">Secure</span>
                  <span className="px-4 py-1.5 border border-gray-200 rounded-full font-sans text-xs text-gray-600 select-none">Close to Campus</span>
                </div>

                <h2 className="font-sans text-2xl font-semibold text-[#192F59] mb-1">Premium Student Living</h2>
                <p className="font-sans text-sm text-gray-500 mb-6">From single rooms to shared apartments.</p>

                <HeroSlideshow images={slideImages} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Properties ───────────────────────────── */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold tracking-widest text-[#E67E22] uppercase mb-2">Latest Listings</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#192F59]">Featured Properties</h2>
            </div>
            <Link href="/properties" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#E67E22] hover:underline">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No listings yet — check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featured.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
                  <div className="relative h-40 bg-gray-100">
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {p.location}
                    </div>
                    <h3 className="font-semibold text-[#192F59] text-sm leading-snug mb-3 line-clamp-2">{p.title}</h3>
                    <div className="mt-auto">
                      <p className="text-[#00A553] font-bold text-lg">
                        ₦{p.price.toLocaleString()}
                        <span className="text-gray-400 text-xs font-normal">/yr</span>
                      </p>
                      {p.distanceToCampus && (
                        <p className="text-xs text-gray-400 mt-0.5">{p.distanceToCampus} km to campus</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {p.amenities.slice(0, 3).map((a) => (
                          <span key={a} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            <AmenityIcon name={a} />
                            {a}
                          </span>
                        ))}
                      </div>
                      <Link href={`/properties/${p.id}`} className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#E67E22] hover:gap-2 transition-all">
                        View details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link href="/properties" className="inline-flex items-center gap-2 bg-[#E67E22] text-white font-semibold px-8 py-3 rounded-xl text-sm">
              View all listings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────── */}
      <section className="py-12 border-y border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { icon: <Shield className="w-5 h-5" />, label: "Every listing admin-verified" },
              { icon: <CheckCircle className="w-5 h-5" />, label: "No hidden fees, ever" },
              { icon: <Users className="w-5 h-5" />, label: "Real landlord profiles" },
              { icon: <MapPin className="w-5 h-5" />, label: "Hyper-local to your campus" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#E67E22]/10 flex items-center justify-center text-[#E67E22]">
                  {icon}
                </div>
                <p className="text-xs text-gray-600 font-medium leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest text-[#E67E22] uppercase mb-2">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#192F59]">Simple for Everyone</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Students */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#192F59]" />
                </div>
                <h3 className="text-xl font-bold text-[#192F59]">For Students</h3>
              </div>
              <div className="space-y-0">
                {STUDENT_STEPS.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-[#E67E22] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                      {i < STUDENT_STEPS.length - 1 && <div className="w-px flex-1 min-h-[2rem] bg-gray-100 my-1" />}
                    </div>
                    <div className="pb-6 pt-1">
                      <div className="flex items-center gap-2 text-[#192F59] mb-1">
                        {step.icon}
                        <h4 className="font-semibold text-sm">{step.title}</h4>
                      </div>
                      <p className="text-sm text-gray-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/register?role=STUDENT" className="inline-flex items-center gap-2 bg-[#192F59] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#1a3570] transition-colors">
                Get started free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Landlords */}
            <div className="bg-[#192F59] rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">For Landlords</h3>
              </div>
              <div className="space-y-0">
                {LANDLORD_STEPS.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-[#E67E22] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                      {i < LANDLORD_STEPS.length - 1 && <div className="w-px flex-1 min-h-[2rem] bg-white/10 my-1" />}
                    </div>
                    <div className="pb-6 pt-1">
                      <div className="flex items-center gap-2 text-white mb-1">
                        {step.icon}
                        <h4 className="font-semibold text-sm">{step.title}</h4>
                      </div>
                      <p className="text-sm text-gray-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/register?role=LANDLORD" className="inline-flex items-center gap-2 bg-[#E67E22] hover:bg-[#D35400] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors">
                List your property <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section id="faq" className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest text-[#E67E22] uppercase mb-2">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#192F59]">Common Questions</h2>
            <p className="text-gray-500 mt-3 text-sm">Everything students and landlords ask before getting started.</p>
          </div>
          <FAQAccordion faqs={FAQS} />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="bg-[#E67E22] py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-bold tracking-tight text-3xl sm:text-5xl text-white mb-4 leading-tight">
            Ready to Find Your<br />
            <span className="italic">Perfect Hostel?</span>
          </h2>
          <p className="text-orange-100 text-base mb-10 max-w-lg mx-auto">
            Join students and landlords already using RentalHub to make housing decisions easier and safer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/properties" className="bg-white text-[#E67E22] font-bold px-10 py-4 rounded-xl hover:bg-orange-50 transition-colors text-sm">
              BROWSE LISTINGS
            </Link>
            <Link href="/register?role=LANDLORD" className="border-2 border-white text-white font-bold px-10 py-4 rounded-xl hover:bg-white/10 transition-colors text-sm">
              LIST YOUR PROPERTY
            </Link>
          </div>
        </div>
      </section>

      <FloatingCTA />
    </div>
  );
}
