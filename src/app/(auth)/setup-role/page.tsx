"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-stub";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Building2, GraduationCap, ArrowRight, Loader2 } from "lucide-react";

export default function SetupRolePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<"STUDENT" | "LANDLORD" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!selected) return;
    setIsLoading(true);
    setError("");

    try {
      console.log("[Setup Role] Starting role setup for:", selected);

      // Step 1: Call API to update role in database
      console.log("[Setup Role] Calling /api/auth/setup-role...");
      const res = await fetch("/api/auth/setup-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selected }),
      });
      const data = await res.json();

      console.log("[Setup Role] API response:", { ok: res.ok, status: res.status, data });

      if (!res.ok || !data.success) {
        const errorMsg = data.error || "Something went wrong. Please try again.";
        console.error("[Setup Role] API failed:", errorMsg);
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      // Step 2: Refresh the JWT so the new role and cleared needsRoleSetup flag
      // take effect immediately without requiring a full sign-out / sign-in
      console.log("[Setup Role] Updating session...");
      await update({ role: selected, needsRoleSetup: false });
      console.log("[Setup Role] Session updated");

      // Step 3: Wait for the session update to propagate to the JWT token
      // This is critical because the middleware will check the token on the next request
      // and we need needsRoleSetup to be false before redirecting
      console.log("[Setup Role] Waiting for session update to propagate...");
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Redirect to the appropriate dashboard
      const redirectPath = selected === "LANDLORD" ? "/landlord" : "/student";
      console.log("[Setup Role] Session update complete. Redirecting to:", redirectPath);
      router.push(redirectPath);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      console.error("[Setup Role] Error occurred:", err);
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="RentalHub" width={160} height={36} className="h-9 w-auto mx-auto mb-5" />
            <h1 className="text-2xl font-bold text-[#192F59]">
              Welcome{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              One last step — tell us how you&apos;ll be using RentalHub.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Role cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {/* Student */}
            <button
              onClick={() => setSelected("STUDENT")}
              className={`rounded-xl border-2 p-6 text-left transition-all focus:outline-none ${
                selected === "STUDENT"
                  ? "border-[#E67E22] bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                selected === "STUDENT" ? "bg-[#E67E22]" : "bg-gray-100"
              }`}>
                <GraduationCap className={`w-6 h-6 ${selected === "STUDENT" ? "text-white" : "text-gray-500"}`} />
              </div>
              <h3 className="font-semibold text-[#192F59] mb-1">I&apos;m a Student</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Browse and book verified off-campus accommodation near your school.
              </p>
            </button>

            {/* Landlord */}
            <button
              onClick={() => setSelected("LANDLORD")}
              className={`rounded-xl border-2 p-6 text-left transition-all focus:outline-none ${
                selected === "LANDLORD"
                  ? "border-[#192F59] bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                selected === "LANDLORD" ? "bg-[#192F59]" : "bg-gray-100"
              }`}>
                <Building2 className={`w-6 h-6 ${selected === "LANDLORD" ? "text-white" : "text-gray-500"}`} />
              </div>
              <h3 className="font-semibold text-[#192F59] mb-1">I&apos;m a Landlord</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                List your property and connect with verified student tenants.
              </p>
            </button>
          </div>

          <button
            onClick={handleContinue}
            disabled={!selected || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#E67E22] hover:bg-[#D35400] text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up your account…
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
