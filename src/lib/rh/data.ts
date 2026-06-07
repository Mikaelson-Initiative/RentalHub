/**
 * data.ts — RentalHub demo data (ported from the Claude Design handoff),
 * modelled on the real seed + schema. Used to populate the redesigned UI
 * until it's wired to the backend API.
 */

export const AREAS = ["Uro", "Odo Oja", "Oke 'Kere", "Afao Road", "Olumilua Estate", "Ajebandele", "Ikoyi Estate", "Amoye GS"];

export interface Campus { id: string; short: string; name: string; live: boolean }
export const CAMPUSES: Campus[] = [
  { id: "bouesti", short: "BOUESTI", name: "BOUESTI, Ikere-Ekiti", live: true },
  { id: "unilag", short: "UNILAG", name: "University of Lagos", live: false },
  { id: "ui", short: "UI", name: "University of Ibadan", live: false },
  { id: "oau", short: "OAU", name: "Obafemi Awolowo University", live: false },
  { id: "unn", short: "UNN", name: "University of Nigeria, Nsukka", live: false },
  { id: "abu", short: "ABU", name: "Ahmadu Bello University, Zaria", live: false },
  { id: "uniben", short: "UNIBEN", name: "University of Benin", live: false },
  { id: "futa", short: "FUTA", name: "Federal University of Technology, Akure", live: false },
];

export const PROPERTY_TYPES = ["Self-contain", "Single room", "Room & parlour", "Studio apartment", "1-bedroom flat", "2-bedroom flat", "3-bedroom flat", "Shared apartment"];
export const DISTANCES = ["Under 500m", "500m – 1km", "1 – 2km", "2 – 5km", "Over 5km"];
export const AMENITY_GROUPS: Record<string, string[]> = {
  Water: ["Borehole", "Running water", "Water tank"],
  Power: ["Prepaid meter", "Standby generator", "Solar backup"],
  Security: ["Gated compound", "Burglary proof", "Security guard", "Fenced"],
  Comfort: ["Tiled floors", "POP ceiling", "Wardrobe", "En-suite", "Parking space", "WiFi ready"],
};

export interface Landlord { id: string; name: string; initials: string; color: string; rating: number; reviews: number; verified: boolean; joined: string; phone: string; responseTime: string }
export const LANDLORDS: Record<string, Landlord> = {
  adebayo: { id: "adebayo", name: "Adebayo Ogunleye", initials: "AO", color: "#2F5D4F", rating: 4.9, reviews: 38, verified: true, joined: "2024", phone: "0803 555 0142", responseTime: "within an hour" },
  funke: { id: "funke", name: "Funke Akinwale", initials: "FK", color: "#C2622E", rating: 4.8, reviews: 24, verified: true, joined: "2024", phone: "0806 555 0198", responseTime: "within 2 hours" },
  chidi: { id: "chidi", name: "Chidi Nwankwo", initials: "CN", color: "#3C5A86", rating: 5.0, reviews: 16, verified: true, joined: "2025", phone: "0809 555 0223", responseTime: "within an hour" },
  bisi: { id: "bisi", name: "Bisi Talabi", initials: "BT", color: "#8A5A6B", rating: 4.7, reviews: 51, verified: true, joined: "2023", phone: "0802 555 0177", responseTime: "same day" },
  yusuf: { id: "yusuf", name: "Yusuf Bello", initials: "YB", color: "#6B7B4A", rating: 4.6, reviews: 12, verified: false, joined: "2025", phone: "0705 555 0310", responseTime: "same day" },
};

export interface Listing {
  id: string; title: string; type: string; area: string; price: number; dist: number; beds: number; baths: number; sqm: number;
  gender: string; vacant: number; landlord: string; rating: number; from: string; to: string; featured: boolean;
  amenities: string[]; landmark: string; desc: string;
}
export const LISTINGS: Listing[] = [
  { id: "uro-sc", title: "Spacious Self-Contain", type: "Self-contain", area: "Uro", price: 180000, dist: 0.5, beds: 1, baths: 1, sqm: 28, gender: "Any", vacant: 2, landlord: "adebayo", rating: 4.9, from: "#d8c4a0", to: "#9c8055", featured: true, amenities: ["Borehole", "Gated compound", "Tiled floors", "Prepaid meter", "Parking space", "Wardrobe"], landmark: "3 houses down from Amoye Grammar School gate, opposite the blue mosque.", desc: "A bright, freshly-painted self-contain just five minutes from the campus main gate. Newly tiled with a private bathroom, fitted wardrobe and steady borehole water. Quiet, gated compound popular with final-year students." },
  { id: "olumilua-2b", title: "Modern 2-Bedroom Flat", type: "2-bedroom flat", area: "Olumilua Estate", price: 320000, dist: 1.2, beds: 2, baths: 2, sqm: 64, gender: "Any", vacant: 1, landlord: "funke", rating: 4.8, from: "#bcae9a", to: "#6f6450", featured: true, amenities: ["Standby generator", "Running water", "POP ceiling", "En-suite", "Tiled floors", "Parking space"], landmark: "Inside Olumilua Estate, second street after the estate gate.", desc: "A well-finished two-bedroom flat in a serene estate. Both rooms en-suite, POP ceilings throughout, standby generator for the compound, and ample parking. Ideal for students sharing or a small family." },
  { id: "afao-room", title: "Budget Room, Shared House", type: "Single room", area: "Afao Road", price: 60000, dist: 2.0, beds: 1, baths: 1, sqm: 14, gender: "Female", vacant: 3, landlord: "bisi", rating: 4.7, from: "#cdb89c", to: "#8a7150", featured: false, amenities: ["Running water", "Fenced", "Burglary proof"], landmark: "Off Afao Road, behind the First Bank branch.", desc: "An affordable single room in a friendly, all-female shared house. Shared kitchen and bathroom kept clean by the caretaker. Great starter option close to transport on Afao Road." },
  { id: "ikoyi-studio", title: "Studio Apartment", type: "Studio apartment", area: "Ikoyi Estate", price: 150000, dist: 1.8, beds: 1, baths: 1, sqm: 32, gender: "Any", vacant: 1, landlord: "chidi", rating: 5.0, from: "#c8bca6", to: "#7d7158", featured: true, amenities: ["WiFi ready", "Running water", "Tiled floors", "Prepaid meter", "Wardrobe"], landmark: "Ikoyi Estate, first close on the right after the junction.", desc: "A neat self-contained studio wired for WiFi, with a kitchenette and good natural light. Prepaid meter means you only pay for what you use. Walkable to campus shuttle pick-up." },
  { id: "odooja-rp", title: "Room & Parlour Self-Contain", type: "Room & parlour", area: "Odo Oja", price: 220000, dist: 1.0, beds: 1, baths: 1, sqm: 42, gender: "Male", vacant: 2, landlord: "adebayo", rating: 4.9, from: "#d3bd98", to: "#897046", featured: false, amenities: ["Borehole", "Standby generator", "POP ceiling", "Tiled floors", "Gated compound"], landmark: "Odo Oja, close to the old market roundabout.", desc: "A roomy room-and-parlour with its own sitting area, private kitchen and toilet. POP ceilings, steady water and a generator on the compound. Suited to students who want more space." },
  { id: "ajeb-1b", title: "Cozy 1-Bedroom Flat", type: "1-bedroom flat", area: "Ajebandele", price: 140000, dist: 2.4, beds: 1, baths: 1, sqm: 38, gender: "Any", vacant: 2, landlord: "funke", rating: 4.8, from: "#c2b49c", to: "#776a52", featured: false, amenities: ["Running water", "Prepaid meter", "Tiled floors", "Burglary proof"], landmark: "Ajebandele, two streets from the express junction.", desc: "A compact one-bedroom flat with a separate kitchen and good cross-ventilation. Burglary-proofed windows and a prepaid meter. Calm neighbourhood with easy bike access to campus." },
  { id: "okekere-sc", title: "Self-Contain near Campus", type: "Self-contain", area: "Oke 'Kere", price: 165000, dist: 0.7, beds: 1, baths: 1, sqm: 26, gender: "Female", vacant: 1, landlord: "bisi", rating: 4.7, from: "#cfba97", to: "#85714c", featured: false, amenities: ["Borehole", "Solar backup", "Tiled floors", "Wardrobe", "Gated compound"], landmark: "Oke 'Kere, beside the pharmacy on the main road.", desc: "A tidy self-contain with solar backup for light when NEPA is off. Fitted wardrobe, tiled throughout, and a borehole that never runs dry. Female-preferred, very close to the campus gate." },
  { id: "amoye-shared", title: "Shared Apartment, 3 Rooms", type: "Shared apartment", area: "Amoye GS", price: 90000, dist: 1.5, beds: 1, baths: 2, sqm: 18, gender: "Male", vacant: 2, landlord: "yusuf", rating: 4.6, from: "#c7b596", to: "#7a6747", featured: false, amenities: ["Running water", "Fenced", "Parking space"], landmark: "Near Amoye Grammar School, off the tarred road.", desc: "A room in a shared three-room apartment for male students. Two shared bathrooms, fenced compound and space to park a bike or small car. Budget-friendly and sociable." },
  { id: "olumilua-3b", title: "Premium 3-Bedroom Flat", type: "3-bedroom flat", area: "Olumilua Estate", price: 450000, dist: 1.3, beds: 3, baths: 3, sqm: 96, gender: "Any", vacant: 1, landlord: "chidi", rating: 5.0, from: "#d6c09a", to: "#8a7048", featured: true, amenities: ["Standby generator", "Borehole", "POP ceiling", "En-suite", "WiFi ready", "Parking space", "Gated compound"], landmark: "Olumilua Estate, gated close near the estate clubhouse.", desc: "A premium three-bedroom flat for students sharing. All rooms en-suite, POP ceilings, fitted kitchen, generator and WiFi-ready. Secure gated close with parking for two cars." },
  { id: "uro-room", title: "Single Room, Quiet Street", type: "Single room", area: "Uro", price: 75000, dist: 0.6, beds: 1, baths: 1, sqm: 12, gender: "Any", vacant: 4, landlord: "adebayo", rating: 4.9, from: "#cbb89a", to: "#80693f", featured: false, amenities: ["Borehole", "Running water", "Fenced"], landmark: "Uro, quiet residential street behind the school.", desc: "A simple, affordable single room on a quiet street minutes from campus. Shared facilities, steady borehole water and a fenced compound. A reliable budget choice." },
  { id: "ikoyi-1b", title: "New 1-Bedroom, Tiled", type: "1-bedroom flat", area: "Ikoyi Estate", price: 175000, dist: 1.9, beds: 1, baths: 1, sqm: 40, gender: "Any", vacant: 2, landlord: "funke", rating: 4.8, from: "#c9b694", to: "#7c6a47", featured: false, amenities: ["Prepaid meter", "Running water", "Tiled floors", "POP ceiling", "Wardrobe"], landmark: "Ikoyi Estate, newly built block near the water tank.", desc: "A brand-new one-bedroom flat, never lived in. Fresh tiles, POP ceiling, fitted wardrobe and a prepaid meter. Bright and airy with a private kitchen." },
  { id: "odooja-studio", title: "Studio with Solar", type: "Studio apartment", area: "Odo Oja", price: 130000, dist: 1.1, beds: 1, baths: 1, sqm: 30, gender: "Female", vacant: 1, landlord: "bisi", rating: 4.7, from: "#cdba98", to: "#86714a", featured: false, amenities: ["Solar backup", "Borehole", "Tiled floors", "Burglary proof", "Gated compound"], landmark: "Odo Oja, gated house near the community church.", desc: "A self-contained studio with a dedicated solar inverter — never sit in darkness during outages. Tiled, burglary-proofed and in a secure gated compound. Female-preferred." },
];

export function listingById(id: string) { return LISTINGS.find((l) => l.id === id); }
export function landlordById(id: string) { return LANDLORDS[id]; }

export const STUDENT_BOOKINGS = [
  { id: "bk1", listingId: "olumilua-2b", status: "AWAITING_PAYMENT", bid: 310000, agencyFee: 31000, cautionFee: 50000, createdAt: "2026-05-28", expiresAt: "2026-06-08T18:00:00", agreementSigned: false },
  { id: "bk2", listingId: "ikoyi-studio", status: "PAID", bid: 150000, agencyFee: 0, cautionFee: 30000, createdAt: "2026-05-12", paidAt: "2026-05-14", moveInDate: "2026-06-01", leaseEndDate: "2027-05-31", movedIn: false, payoutStatus: "PENDING", agreementSigned: true, agreementName: "Chioma Eze" },
  { id: "bk3", listingId: "uro-sc", status: "PENDING", bid: 175000, createdAt: "2026-06-02" },
  { id: "bk4", listingId: "afao-room", status: "CONFIRMED", bid: 60000, createdAt: "2026-05-30" },
] as const;

export const LANDLORD_REQUESTS = [
  { id: "rq1", listingId: "uro-sc", student: "Chioma Eze", bid: 175000, status: "PENDING", createdAt: "2026-06-02", otherBids: 2 },
  { id: "rq2", listingId: "uro-sc", student: "Tunde Bakare", bid: 180000, status: "PENDING", createdAt: "2026-06-01", otherBids: 2 },
  { id: "rq3", listingId: "odooja-rp", student: "Ibrahim Sani", bid: 220000, status: "AWAITING_PAYMENT", createdAt: "2026-05-29" },
  { id: "rq4", listingId: "uro-room", student: "Grace Okafor", bid: 75000, status: "PAID", createdAt: "2026-05-10" },
] as const;

export const LANDLORD_EARNINGS = {
  total: 405000, monthly: 150000, paidCount: 3,
  rows: [
    { listingId: "uro-room", student: "Grace Okafor", amount: 75000, paidAt: "2026-05-10", moveIn: "2026-05-20", ref: "RH-8F3K2A" },
    { listingId: "odooja-rp", student: "Samuel Aluko", amount: 220000, paidAt: "2026-04-22", moveIn: "2026-05-01", ref: "RH-7B2M9X" },
    { listingId: "uro-sc", student: "Halima Yusuf", amount: 110000, paidAt: "2026-03-18", moveIn: "2026-04-01", ref: "RH-5C1L4Q" },
  ],
};

export const ADMIN_SUMMARY = { totalProperties: 242, pendingApprovals: 6, totalUsers: 1184, totalBookings: 318, pendingVerifications: 4, pendingPayouts: 3 };

export const ADMIN_PENDING = [
  { id: "pp1", title: "Newly Built Self-Contain", landlord: "Yusuf Bello", area: "Amoye GS", price: 170000, media: 8, submitted: "2026-06-04", aiScore: "PASS", aiNote: "Photos consistent with description; price within market range." },
  { id: "pp2", title: "2-Bedroom Flat, Estate", landlord: "Funke Akinwale", area: "Olumilua Estate", price: 340000, media: 12, submitted: "2026-06-03", aiScore: "REVIEW", aiNote: "Price 18% above area median — verify finishing." },
  { id: "pp3", title: "Budget Room", landlord: "Bisi Talabi", area: "Afao Road", price: 55000, media: 4, submitted: "2026-06-03", aiScore: "PASS", aiNote: "Looks consistent. Few photos — consider requesting more." },
  { id: "pp4", title: "Shared Apartment", landlord: "Yusuf Bello", area: "Uro", price: 95000, media: 6, submitted: "2026-06-02", aiScore: "FAIL", aiNote: "Stock-looking images detected — request original photos." },
] as const;

export const ADMIN_VERIFICATIONS = [
  { id: "v1", name: "Yusuf Bello", email: "yusuf.bello@gmail.com", status: "UNDER_REVIEW", aiScore: "PASS", aiNote: "ID and selfie match. Ownership document legible.", submitted: "2026-06-04", docs: { id: true, selfie: true, ownership: true } },
  { id: "v2", name: "Ngozi Eze", email: "ngozi.eze@yahoo.com", status: "UNDER_REVIEW", aiScore: "REVIEW", aiNote: "Selfie slightly blurred — confirm match manually.", submitted: "2026-06-03", docs: { id: true, selfie: true, ownership: true } },
  { id: "v3", name: "Musa Danladi", email: "musa.d@gmail.com", status: "REJECTED", aiScore: "FAIL", aiNote: "Ownership proof did not match the listed address.", submitted: "2026-05-30", docs: { id: true, selfie: true, ownership: false } },
  { id: "v4", name: "Kemi Adeyemi", email: "kemi.adeyemi@gmail.com", status: "UNDER_REVIEW", aiScore: "PASS", aiNote: "All documents clear and matching.", submitted: "2026-06-05", docs: { id: true, selfie: true, ownership: true } },
] as const;

export const ADMIN_PAYOUTS = [
  { id: "po1", listingId: "ikoyi-studio", student: "Chioma Eze", landlord: "Chidi Nwankwo", amount: 150000, agencyFee: 0, cautionFee: 30000, movedIn: "2026-06-01", bank: "GTBank", acct: "0123456789", acctName: "Chidi Nwankwo" },
  { id: "po2", listingId: "uro-room", student: "Grace Okafor", landlord: "Adebayo Ogunleye", amount: 75000, agencyFee: 0, cautionFee: 15000, movedIn: "2026-05-20", bank: "Access Bank", acct: "0987654321", acctName: "Adebayo Ogunleye" },
  { id: "po3", listingId: "odooja-studio", student: "Halima Yusuf", landlord: "Bisi Talabi", amount: 130000, agencyFee: 13000, cautionFee: 25000, movedIn: "2026-05-18", bank: "UBA", acct: "2233445566", acctName: "Bisi Talabi" },
] as const;

export const ADMIN_FORECAST = {
  verdict: "Demand rising",
  note: "Bookings are up 23% month-on-month heading into the new session. Self-contains under ₦200k near Uro and Oke 'Kere are clearing fastest. Consider encouraging more verified listings in those areas.",
  months: [{ m: "Jan", v: 22 }, { m: "Feb", v: 28 }, { m: "Mar", v: 41 }, { m: "Apr", v: 38 }, { m: "May", v: 52 }, { m: "Jun", v: 64 }],
  hotAreas: [{ area: "Uro", demand: 92 }, { area: "Oke 'Kere", demand: 81 }, { area: "Olumilua Estate", demand: 64 }, { area: "Odo Oja", demand: 58 }, { area: "Ikoyi Estate", demand: 49 }],
};
