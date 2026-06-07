"use client";

/**
 * app.tsx — client glue for the ported design.
 *
 * The Claude Design prototype used a hash router + a single AppProvider with
 * role/campus/toast. Here we keep campus + toast + a viewport hook, and map the
 * prototype's `go(route, arg, params)` calls onto real Next.js routes so the
 * ported components work almost verbatim.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { T, I } from "@/lib/rh/theme";
import { CAMPUSES, type Campus } from "@/lib/rh/data";

type Params = Record<string, string> | undefined;

const ROUTE_MAP: Record<string, (arg?: string | null, params?: Params) => string> = {
  home: () => "/",
  search: (_a, params) => "/properties" + (params?.area ? `?area=${encodeURIComponent(params.area)}` : ""),
  property: (arg) => `/properties/${arg ?? ""}`,
  login: () => "/login",
  register: () => "/register",
  forgot: () => "/forgot-password",
  reset: () => "/reset-password",
  verify: (_a, params) => "/verify-email" + (params?.role ? `?role=${encodeURIComponent(params.role)}` : ""),
  "setup-role": () => "/setup-role",
  student: () => "/student",
  "student-profile": () => "/student/profile",
  receipt: (arg) => `/student/bookings/${arg ?? "bk"}/receipt`,
  pay: (arg) => `/student/bookings/${arg ?? "bk"}/verify-payment`,
  booking: () => "/student",
  landlord: () => "/landlord",
  "landlord-info": () => "/landlord",
  "landlord-profile": () => "/landlord/profile",
  "landlord-verification": () => "/landlord/verification",
  "add-property": () => "/landlord/add-property",
  manage: (arg) => `/landlord/properties/${arg ?? ""}`,
  "edit-property": (arg) => `/landlord/edit-property/${arg ?? ""}`,
  admin: () => "/admin",
  review: (arg) => `/admin/properties/${arg ?? ""}`,
  pending: () => "/pending-approval",
  unauthorized: () => "/unauthorized",
  privacy: () => "/privacy",
  terms: () => "/terms",
  "how-it-works": () => "/#how-it-works",
  safety: () => "/",
  about: () => "/",
  help: () => "/",
};

export type GoFn = (route: string, arg?: string | null, params?: Params) => void;

interface AppValue {
  go: GoFn;
  role: string;
  campus: Campus;
  setCampus: (id: string) => void;
  showToast: (msg: string) => void;
}

const AppCtx = createContext<AppValue | null>(null);

export function useApp(): AppValue {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}

export function useViewport() {
  const [w, setW] = useState(1200); // SSR-safe default (desktop)
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return { w, mobile: w < 768, tablet: w >= 768 && w < 1080 };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [campusId, setCampusId] = useState("bouesti");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("rh_campus");
    if (saved) setCampusId(saved);
  }, []);

  const campus = CAMPUSES.find((c) => c.id === campusId) || CAMPUSES[0];

  const go = useCallback<GoFn>((route, arg, params) => {
    const fn = ROUTE_MAP[route];
    router.push(fn ? fn(arg, params) : "/" + route);
  }, [router]);

  const setCampus = useCallback((id: string) => {
    setCampusId(id);
    window.localStorage.setItem("rh_campus", id);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <AppCtx.Provider value={{ go, role: "guest", campus, setCampus, showToast }}>
      {children}
      {toast && (
        <div style={{ position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 200, background: T.ink, color: T.paper, padding: "13px 22px", borderRadius: 12, fontFamily: T.sans, fontSize: 14.5, fontWeight: 500, boxShadow: "0 16px 40px -12px rgba(0,0,0,.5)", display: "flex", alignItems: "center", gap: 9, maxWidth: "90vw" }}>
          {I.checkCircle({ width: 18, height: 18, style: { color: "#7FD6A6", flex: "0 0 auto" } })}
          {toast}
        </div>
      )}
    </AppCtx.Provider>
  );
}
