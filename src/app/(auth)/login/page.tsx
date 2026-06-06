"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { signIn, signOut } from "@/lib/auth-stub";
import { useRouter, useSearchParams } from "next/navigation";

function LoginPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const emailParam = params.get("email");
    if (emailParam) {
      setFormData((prev) => ({ ...prev, email: emailParam }));
    }
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("EMAIL_NOT_VERIFIED")) {
          setError("Please verify your email first. We sent you an OTP during registration.");
          router.push(`/verify-email?email=${encodeURIComponent(formData.email.toLowerCase().trim())}`);
        } else if (result.error.includes("GOOGLE_ACCOUNT_NO_PASSWORD")) {
          setError("This email is registered via Google. Please use 'Continue with Google' to sign in.");
        } else {
          setError("Invalid email or password");
        }
        setIsLoading(false);
        return;
      }

      // Successful login - get session to check role
      const response = await fetch("/api/auth/session");
      const session = await response.json();
      const selectedRole = formData.role;
      const actualRole = session?.user?.role;

      if (actualRole && selectedRole !== actualRole) {
        await signOut({ redirect: false });
        setError(`This account is ${actualRole.toLowerCase()}, not ${selectedRole.toLowerCase()}.`);
        setIsLoading(false);
        return;
      }

      if (actualRole) {
        const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");
        // Honour callbackUrl for students returning from a property page
        if (callbackUrl && actualRole === "STUDENT" && callbackUrl.startsWith("/properties/")) {
          router.push(callbackUrl);
        } else {
          switch (actualRole) {
            case "LANDLORD":
              router.push("/landlord");
              break;
            case "STUDENT":
              router.push("/student");
              break;
            case "ADMIN":
              router.push("/admin");
              break;
            default:
              router.push("/");
          }
        }
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-xl shadow-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#192F59]">Welcome Back</h1>
            <p className="text-gray-600 mt-2">
              Sign in to your RentalHub account
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selector */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700"
              >
                I am logging in as
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E67E22] focus:border-transparent"
              >
                <option value="STUDENT">Student</option>
                <option value="LANDLORD">Landlord</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E67E22] focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E67E22] focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 text-[#E67E22] focus:ring-[#E67E22] border-gray-300 rounded"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-[#E67E22] hover:text-[#D35400]"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#E67E22] hover:bg-[#D35400] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="mt-4 w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-[#E67E22] hover:text-[#D35400] font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
            <p className="text-sm text-gray-600">Loading login...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
