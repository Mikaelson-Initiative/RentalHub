/**
 * api.ts — thin client for the RentalHub backend (separate repo).
 *
 * Base URL comes from NEXT_PUBLIC_API_URL; falls back to the deployed backend.
 * The backend wraps responses as { success, data } / { success, error }.
 * `credentials: "include"` so cookie sessions work once auth is wired.
 */
import type { Listing } from "@/lib/rh/data";

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://rentalhub-backend-blue.vercel.app").replace(/\/$/, "");

export const AUTH_STORAGE_KEY = "rh_auth";

function authToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || "null")?.token ?? null; } catch { return null; }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authToken();
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  });
  let json: { success?: boolean; data?: unknown; error?: string } | null = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return (json?.data ?? json) as T;
}

export const apiGet = <T>(path: string) => request<T>(path);
export const apiPost = <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
export const apiPut = <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined });

// ── Auth (cross-origin-safe: plain JSON POSTs, no session cookie needed) ──
export const registerUser = (body: { name: string; email: string; password: string; role: string }) =>
  apiPost("/api/auth/register", body);
export const verifyEmailOtp = (email: string, otp: string) =>
  apiPost("/api/auth/verify-email/confirm", { email, otp });
export const resendOtp = (email: string) =>
  apiPost("/api/auth/verify-email/send", { email });

// ── Backend property shape (Prisma model, JSON-serialized) ────
export interface ApiLandlord { id: string; name: string; email?: string; verificationStatus?: string }
export interface ApiProperty {
  id: string; title: string; description: string; price: number | string; distanceToCampus?: number | string | null;
  amenities?: unknown; images?: unknown; status?: string; vacantUnits?: number;
  location?: { id: string; name: string } | null; landlord?: ApiLandlord | null;
  _count?: { bookings: number };
}
export interface ApiListResponse { items: ApiProperty[]; total: number; page: number; pageSize: number; totalPages: number }

// UI listing enriched with the landlord info the detail page needs.
export type UiListing = Listing & { landlordName: string; landlordVerified: boolean; landlordEmail?: string; image?: string | null };

const TONES: [string, string][] = [["#d8c4a0", "#9c8055"], ["#c8bca6", "#7d7158"], ["#cdb89c", "#8a7150"], ["#bcae9a", "#6f6450"], ["#d3bd98", "#897046"], ["#c2b49c", "#776a52"]];
function toneFor(id: string): [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}
function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x : typeof x === "object" && x && "url" in x ? String((x as { url: unknown }).url) : "")).filter(Boolean);
}
function imageStrings(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item === "string" && item.startsWith("http")) out.push(item);
    else if (typeof item === "object" && item && "url" in item) { const u = (item as { url: unknown }).url; if (typeof u === "string") out.push(u); }
  }
  return out;
}

/** Map a backend Property into the shape the redesigned UI renders. */
export function mapProperty(p: ApiProperty): UiListing & { images: string[] } {
  const [from, to] = toneFor(p.id);
  return {
    id: p.id,
    title: p.title,
    type: "Apartment",
    area: p.location?.name ?? "—",
    price: Number(p.price) || 0,
    dist: p.distanceToCampus != null ? Number(p.distanceToCampus) : 0,
    beds: 1,
    baths: 1,
    sqm: 0,
    gender: "Any",
    vacant: p.vacantUnits ?? 0,
    landlord: p.landlord?.id ?? "",
    rating: 0,
    from,
    to,
    featured: false,
    amenities: toStringArray(p.amenities),
    landmark: "",
    desc: p.description ?? "",
    images: imageStrings(p.images),
    image: imageStrings(p.images)[0] ?? null,
    landlordName: p.landlord?.name ?? "Landlord",
    landlordVerified: p.landlord?.verificationStatus === "VERIFIED",
    landlordEmail: p.landlord?.email,
  };
}
