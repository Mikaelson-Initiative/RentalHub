"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth-stub";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Camera, Save, User, Mail, Phone, BookOpen } from "lucide-react";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  createdAt: string;
  _count: { bookings: number };
}

export default function StudentProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/student/profile", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load profile.");
      setProfile(data.data);
      setName(data.data.name ?? "");
      setPhoneNumber(data.data.phoneNumber ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    setIsUploadingAvatar(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "avatar");
      const uploadRes = await fetch("/api/uploads", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.success) throw new Error(uploadData.error || "Upload failed.");

      const url = uploadData.data?.url ?? uploadData.url ?? uploadData.data;
      const patchRes = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok || !patchData.success) throw new Error(patchData.error || "Failed to save avatar.");

      setProfile((prev) => prev ? { ...prev, avatarUrl: url } : prev);
      await updateSession();
      setSuccess("Avatar updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Avatar upload failed.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phoneNumber: phoneNumber.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to update profile.");
      setProfile((prev) => prev ? { ...prev, name: data.data.name, phoneNumber: data.data.phoneNumber } : prev);
      await updateSession({ name: data.data.name });
      setSuccess("Profile updated successfully.");
      setEditMode(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="text-center py-16 text-gray-500">Loading profile...</div>;

  const userInitial = profile?.name?.charAt(0).toUpperCase() || (session?.user?.name?.charAt(0).toUpperCase() ?? "S");
  const memberSince = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" }) : "";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/student" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      {/* Avatar + name banner */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-[#192F59] flex items-center justify-center text-white text-2xl font-bold">
            {profile?.avatarUrl ? (
              <Image src={profile.avatarUrl} alt={profile.name} width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              userInitial
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#E67E22] hover:bg-[#D35400] rounded-full flex items-center justify-center text-white shadow-sm transition-colors disabled:opacity-50"
            title="Change photo"
          >
            {isUploadingAvatar ? (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        {/* min-w-0 + flex-1 lets this section shrink so email never overflows */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-navy truncate">{profile?.name}</h1>
          <p className="text-gray-500 text-sm truncate">{profile?.email}</p>
          <p className="text-xs text-gray-400 mt-0.5">Member since {memberSince}</p>
        </div>
        <div className="flex-shrink-0 text-center pl-2">
          <div className="text-2xl font-bold text-primary-green">{profile?._count.bookings ?? 0}</div>
          <div className="text-xs text-gray-500">Bookings</div>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-navy">Personal Information</h2>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="text-sm text-[#192F59] hover:text-[#E67E22] font-medium transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Name */}
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-gray-400 mt-2.5 flex-shrink-0" />
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Full Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#192F59]/20"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800">{profile?.name}</p>
              )}
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-gray-400 mt-2.5 flex-shrink-0" />
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Email Address</label>
              <p className="text-sm font-medium text-gray-800">{profile?.email}</p>
              <p className="text-xs text-gray-400">Email cannot be changed here</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-gray-400 mt-2.5 flex-shrink-0" />
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
              {editMode ? (
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#192F59]/20"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800">{profile?.phoneNumber || <span className="text-gray-400 italic">Not set</span>}</p>
              )}
            </div>
          </div>

          {/* Bookings count */}
          <div className="flex items-start gap-3">
            <BookOpen className="w-4 h-4 text-gray-400 mt-2.5 flex-shrink-0" />
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Total Bookings</label>
              <p className="text-sm font-medium text-gray-800">{profile?._count.bookings ?? 0}</p>
            </div>
          </div>

          {editMode && (
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setName(profile?.name ?? "");
                  setPhoneNumber(profile?.phoneNumber ?? "");
                  setError("");
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 bg-[#192F59] hover:bg-[#14264a] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
