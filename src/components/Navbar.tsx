"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-stub";
import { Search, MessageSquare, HelpCircle, Plus } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Left Side */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/logo.png"
              alt="RentalHub"
              width={180}
              height={40}
              className="h-10 w-auto"
            />
          </Link>

          {/* Global Search Bar - Center */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-full max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties or tenants..."
                className="w-full bg-gray-100 rounded-full py-2.5 pl-11 pr-4 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E67E22]/20 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right Side - Actions & Profile */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              // Logged in user view
              <>
                {/* Add Listing Button */}
                <button className="hidden sm:flex items-center gap-2 bg-[#E67E22] hover:bg-[#D35400] text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Add Listing</span>
                </button>

                {/* Action Icons */}
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-600 hover:text-[#E67E22] transition-colors rounded-full hover:bg-gray-100">
                    <MessageSquare className="w-5 h-5" />
                  </button>

                  <NotificationBell />
                  
                  <button className="p-2 text-gray-600 hover:text-[#E67E22] transition-colors rounded-full hover:bg-gray-100">
                    <HelpCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div className="w-10 h-10 bg-[#E67E22] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="hidden lg:block">
                    <p className="font-sans text-sm font-medium text-gray-900">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="font-sans text-xs text-gray-500 capitalize">
                      {session?.user?.role?.toLowerCase()}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              // Guest view
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="font-sans text-sm font-medium text-[#192F59] hover:text-[#E67E22] transition-colors"
                >
                  LOGIN
                </Link>
                <Link
                  href="/register?role=LANDLORD"
                  className="font-sans text-xs font-semibold bg-[#E67E22] hover:bg-[#D35400] text-white px-5 py-2.5 rounded-lg transition-colors"
                >
                  LIST PROPERTY
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
