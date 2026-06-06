"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-stub";
import { Search, LogOut, User } from "lucide-react";
import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";

export default function DashboardNavbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const userInitial = session?.user?.name?.charAt(0).toUpperCase() || "U";
  const userName = session?.user?.name || "User";
  const userRole = session?.user?.role?.toLowerCase() || "user";
  const avatarUrl = (session?.user as { avatarUrl?: string | null })?.avatarUrl;

  const profileHref = session?.user?.role === "LANDLORD"
    ? "/landlord/profile"
    : session?.user?.role === "STUDENT"
    ? "/student/profile"
    : "/admin";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/properties?location=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Clicking the logo signs the user out and returns them to the home page
  const handleHomeClick = () => {
    void signOut({ callbackUrl: "/" });
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo – clicking signs out and goes home */}
          <button
            onClick={handleHomeClick}
            className="flex items-center flex-shrink-0 focus:outline-none"
            aria-label="Go to home and sign out"
          >
            <Image
              src="/logo.png"
              alt="RentalHub"
              width={180}
              height={40}
              className="h-8 sm:h-10 w-auto"
            />
          </button>

          {/* Global Search Bar – center, desktop only */}
          <form onSubmit={handleSearch} className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-full max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search properties by location..."
                className="w-full bg-gray-100 rounded-full py-2.5 pl-11 pr-4 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all"
              />
            </div>
          </form>

          {/* Right Side – profile → logout → bell (bell must be rightmost so its
              dropdown aligns correctly with right-0 on all screen sizes) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href={profileHref} className="flex items-center gap-2 sm:gap-3 group">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0 bg-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={userName}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userInitial
                  )}
                </div>
                <div className="hidden lg:block">
                  <p className="font-sans text-sm font-medium text-gray-900 group-hover:text-[#E67E22] transition-colors">
                    {userName}
                  </p>
                  <p className="font-sans text-xs text-gray-500 capitalize flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {userRole}
                  </p>
                </div>
              </Link>

              {/* Logout */}
              <button
                onClick={() => void signOut({ callbackUrl: "/" })}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-100"
                title="Logout"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-200" />

            {/* Notification Bell – rightmost so dropdown aligns to screen edge */}
            <NotificationBell />
          </div>
        </div>
      </div>
    </nav>
  );
}
