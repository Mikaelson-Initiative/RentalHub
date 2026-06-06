"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-stub";
import { Menu, X, Plus, User } from "lucide-react";

const navLinks = [
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/properties", label: "Browse" },
  { href: "/#faq", label: "FAQ" },
];

export default function PublicNavbar() {
  const { data: session, status } = useSession();
  const isAuthenticated =
    status === "authenticated" && Boolean(session?.user?.email);
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";
  const showDashboardActions = !isHomePage && !isAuthPage && isAuthenticated;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!session?.user?.role) return "/";
    switch (session.user.role) {
      case "LANDLORD":
        return "/landlord";
      case "STUDENT":
        return "/student";
      case "ADMIN":
        return "/admin";
      default:
        return "/";
    }
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/logo.png"
              alt="RentalHub"
              width={180}
              height={40}
              className="h-9 w-auto"
            />
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {status === "loading" ? null : showDashboardActions ? (
              <>
                <Link
                  href={getDashboardLink()}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium text-black border border-black px-4 py-2 rounded-md hover:bg-black hover:text-white transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  href="/register?role=LANDLORD"
                  className="flex items-center gap-1 text-sm font-semibold bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  List Property
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-orange-500 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-gray-700 hover:text-orange-500 transition-colors py-2"
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-gray-100 my-2" />

              {status === "loading" ? null : showDashboardActions ? (
                <>
                  <Link
                    href={getDashboardLink()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-base font-medium text-gray-700 hover:text-orange-500 transition-colors py-2"
                  >
                    <User className="w-5 h-5" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: "/" });
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-base font-medium text-gray-500 hover:text-red-500 transition-colors py-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-gray-700 hover:text-orange-500 transition-colors py-2"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-black border border-black px-4 py-2 rounded-md text-center hover:bg-black hover:text-white transition-colors"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/register?role=LANDLORD"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 text-base font-semibold bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    List Property
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
