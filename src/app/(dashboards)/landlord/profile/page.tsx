"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth-stub";
import Link from "next/link";
import Image from "next/image";
import {
  User, Mail, Phone, ShieldCheck, ShieldAlert, Clock, ShieldX,
  Edit2, Save, X, ChevronLeft, Calendar, Home, CheckCircle, Camera,
  Banknote, Search, AlertCircle,
} from "lucide-react";

interface Bank { id: number; name: string; code: string; }

interface BankAccount {
  bankAccountNumber: string | null;
  bankCode: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  paystackRecipientCode: string | null;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: string;
  verificationStatus: string;
  createdAt: string;
  governmentIdUrl: string | null;
  selfieUrl: string | null;
  ownershipProofUrl: string | null;
  verificationSubmittedAt: string | null;
  verificationNote: string | null;
  _count: { properties: number; bookings: number };
}

function VerificationBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    VERIFIED: {
      label: "Verified",
      icon: <ShieldCheck className="w-4 h-4" />,
      className: "bg-green-100 text-green-700",
    },
    UNDER_REVIEW: {
      label: "Under Review",
      icon: <Clock className="w-4 h-4" />,
      className: "bg-blue-100 text-blue-700",
    },
    UNVERIFIED: {
      label: "Not Verified",
      icon: <ShieldAlert className="w-4 h-4" />,
      className: "bg-amber-100 text-amber-700",
    },
    REJECTED: {
      label: "Rejected",
      icon: <ShieldX className="w-4 h-4" />,
      className: "bg-red-100 text-red-700",
    },
  };

  const cfg = map[status] ?? map.UNVERIFIED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function LandlordProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: "", email: "", phoneNumber: "" });

  // Bank account state
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [bankForm, setBankForm] = useState({ accountNumber: "", bankCode: "", bankName: "" });
  const [resolvedAccountName, setResolvedAccountName] = useState("");
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [bankError, setBankError] = useState("");
  const [bankSuccess, setBankSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, banksRes, bankAccountRes] = await Promise.all([
          fetch("/api/landlord/profile"),
          fetch("/api/paystack/banks"),
          fetch("/api/landlord/bank-account"),
        ]);
        const [profileJson, banksJson, bankAccountJson] = await Promise.all([
          profileRes.json(),
          banksRes.json(),
          bankAccountRes.json(),
        ]);
        if (profileRes.ok && profileJson.success) {
          setProfile(profileJson.data);
          setForm({
            name: profileJson.data.name,
            email: profileJson.data.email,
            phoneNumber: profileJson.data.phoneNumber ?? "",
          });
        }
        if (banksRes.ok && banksJson.success) setBanks(banksJson.banks);
        if (bankAccountRes.ok && bankAccountJson.success) {
          setBankAccount(bankAccountJson.data);
          if (bankAccountJson.data.bankCode) {
            setBankForm({
              accountNumber: bankAccountJson.data.bankAccountNumber ?? "",
              bankCode: bankAccountJson.data.bankCode ?? "",
              bankName: bankAccountJson.data.bankName ?? "",
            });
            setResolvedAccountName(bankAccountJson.data.bankAccountName ?? "");
          }
        }
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", "avatar");
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Upload failed");
      const url = json.data.url as string;
      // Save avatarUrl to profile
      const patchRes = await fetch("/api/landlord/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      const patchJson = await patchRes.json();
      if (!patchRes.ok || !patchJson.success) throw new Error(patchJson.error || "Failed to save avatar");
      setProfile((prev) => prev ? { ...prev, avatarUrl: url } : prev);
      await updateSession({ avatarUrl: url });
      setSuccess("Profile photo updated!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Avatar upload failed.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/landlord/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to save.");
      setProfile((prev) => prev ? { ...prev, ...json.data } : prev);
      setEditing(false);
      setSuccess("Profile updated successfully.");
      // Refresh session so navbar shows updated name
      await updateSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) setForm({ name: profile.name, email: profile.email, phoneNumber: profile.phoneNumber ?? "" });
    setEditing(false);
    setError("");
  };

  const handleResolveAccount = async () => {
    if (!bankForm.accountNumber || !bankForm.bankCode) return;
    setResolvingAccount(true);
    setBankError("");
    setResolvedAccountName("");
    try {
      const res = await fetch(`/api/landlord/verify-account?account_number=${bankForm.accountNumber}&bank_code=${bankForm.bankCode}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Could not resolve account.");
      setResolvedAccountName(json.accountName);
    } catch (e) {
      setBankError(e instanceof Error ? e.message : "Failed to resolve account.");
    } finally {
      setResolvingAccount(false);
    }
  };

  const handleSaveBank = async () => {
    if (!resolvedAccountName) {
      setBankError("Please verify your account number first.");
      return;
    }
    setSavingBank(true);
    setBankError("");
    setBankSuccess("");
    try {
      const res = await fetch("/api/landlord/bank-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber: bankForm.accountNumber,
          bankCode: bankForm.bankCode,
          bankName: bankForm.bankName,
          accountName: resolvedAccountName,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to save account.");
      setBankAccount({
        bankAccountNumber: bankForm.accountNumber,
        bankCode: bankForm.bankCode,
        bankName: bankForm.bankName,
        bankAccountName: resolvedAccountName,
        paystackRecipientCode: "set",
      });
      setBankSuccess("Payout account saved successfully.");
    } catch (e) {
      setBankError(e instanceof Error ? e.message : "Failed to save account.");
    } finally {
      setSavingBank(false);
    }
  };

  const initials = (profile?.name ?? session?.user?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/landlord"
        className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account information</p>
      </div>

      {/* Avatar + stats card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar with upload */}
          <div className="relative flex-shrink-0 group">
            <div className="w-20 h-20 rounded-full bg-[#192F59] flex items-center justify-center overflow-hidden">
              {profile?.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">{initials}</span>
              )}
            </div>
            {/* Upload overlay */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              title="Change photo"
            >
              {avatarUploading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]); }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-900 truncate">{profile?.name}</h2>
              <VerificationBadge status={profile?.verificationStatus ?? "UNVERIFIED"} />
            </div>
            <p className="text-gray-500 text-sm truncate">{profile?.email}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Home className="w-4 h-4" />
                {profile?._count.properties ?? 0} listing{profile?._count.properties !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Member since {profile ? new Date(profile.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long" }) : "—"}
              </span>
            </div>
          </div>

          {!editing && (
            <button
              onClick={() => { setEditing(true); setSuccess(""); setError(""); }}
              className="flex items-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors self-start sm:self-center"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Profile fields */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {/* Name */}
        <div className="p-6 flex items-start gap-4">
          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <User className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Full Name</p>
            {editing ? (
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#192F59]/30"
              />
            ) : (
              <p className="text-gray-900 font-medium">{profile?.name}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="p-6 flex items-start gap-4">
          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Mail className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Email Address</p>
            {editing ? (
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#192F59]/30"
              />
            ) : (
              <p className="text-gray-900 font-medium">{profile?.email}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="p-6 flex items-start gap-4">
          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Phone className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Phone Number</p>
            {editing ? (
              <input
                type="tel"
                value={form.phoneNumber}
                placeholder="e.g. 08012345678"
                onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#192F59]/30"
              />
            ) : (
              <p className="text-gray-900 font-medium">
                {profile?.phoneNumber ?? <span className="text-gray-400 italic">Not provided</span>}
              </p>
            )}
          </div>
        </div>

        {/* Account type — read only */}
        <div className="p-6 flex items-start gap-4">
          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Account Type</p>
            <p className="text-gray-900 font-medium capitalize">{profile?.role.toLowerCase()}</p>
          </div>
        </div>
      </div>

      {/* Save / Cancel */}
      {editing && (
        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#192F59] hover:bg-blue-900 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {/* Verification section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-5">
        <h3 className="font-semibold text-gray-900 mb-4">Verification Status</h3>

        <div className="space-y-3">
          {[
            { label: "Government ID", uploaded: !!profile?.governmentIdUrl },
            { label: "Selfie with ID", uploaded: !!profile?.selfieUrl },
            { label: "Ownership Proof", uploaded: !!profile?.ownershipProofUrl },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{item.label}</span>
              <span className={`text-xs font-medium flex items-center gap-1 ${item.uploaded ? "text-green-600" : "text-gray-400"}`}>
                {item.uploaded ? <><CheckCircle className="w-3.5 h-3.5" /> Uploaded</> : "Not uploaded"}
              </span>
            </div>
          ))}
        </div>

        {profile?.verificationNote && (
          <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
            <p className="font-medium mb-1">Rejection note from admin:</p>
            <p className="italic">&ldquo;{profile.verificationNote}&rdquo;</p>
          </div>
        )}

        {profile?.verificationStatus !== "VERIFIED" && (
          <div className="mt-4">
            {profile?.verificationStatus === "UNDER_REVIEW" ? (
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-5 py-2.5 rounded-xl text-sm font-medium">
                <Clock className="w-4 h-4" />
                Under Review — we&apos;ll email you within 24–48 hours
              </div>
            ) : (
              <Link
                href="/landlord/verification"
                className="inline-flex items-center gap-2 bg-[#E67E22] hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                {profile?.verificationStatus === "REJECTED"
                  ? "Resubmit Documents"
                  : "Complete Verification"}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Payout Account ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-5">
        <div className="flex items-center gap-2 mb-1">
          <Banknote className="w-5 h-5 text-[#192F59]" />
          <h3 className="font-semibold text-gray-900">Payout Account</h3>
          {bankAccount?.paystackRecipientCode && (
            <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" /> Verified
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-5">
          This is the bank account where your rent payments will be sent when a student confirms they have moved in.
        </p>

        {/* Alerts */}
        {bankError && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {bankError}
          </div>
        )}
        {bankSuccess && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> {bankSuccess}
          </div>
        )}

        <div className="space-y-4">
          {/* Bank selector */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Bank Name</label>
            <select
              value={bankForm.bankCode}
              onChange={(e) => {
                const selected = banks.find((b) => b.code === e.target.value);
                setBankForm((f) => ({ ...f, bankCode: e.target.value, bankName: selected?.name ?? "" }));
                setResolvedAccountName("");
                setBankError("");
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#192F59]/30 bg-white"
            >
              <option value="">Select your bank…</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Account number + verify */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Account Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit NUBAN number"
                value={bankForm.accountNumber}
                onChange={(e) => {
                  setBankForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, "") }));
                  setResolvedAccountName("");
                  setBankError("");
                }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#192F59]/30"
              />
              <button
                onClick={handleResolveAccount}
                disabled={resolvingAccount || bankForm.accountNumber.length !== 10 || !bankForm.bankCode}
                className="flex items-center gap-1.5 border border-[#192F59] text-[#192F59] hover:bg-[#192F59] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {resolvingAccount
                  ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <Search className="w-4 h-4" />}
                {resolvingAccount ? "Verifying…" : "Verify"}
              </button>
            </div>
          </div>

          {/* Resolved account name */}
          {resolvedAccountName && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Account Name</p>
                <p className="text-sm font-bold text-green-800">{resolvedAccountName}</p>
              </div>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSaveBank}
            disabled={savingBank || !resolvedAccountName}
            className="flex items-center gap-2 bg-[#192F59] hover:bg-[#14264a] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {savingBank
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save className="w-4 h-4" />}
            {savingBank ? "Saving…" : "Save Payout Account"}
          </button>

          {/* Existing account display */}
          {bankAccount?.bankAccountName && !bankSuccess && (
            <div className="mt-2 pt-4 border-t border-gray-100 text-sm text-gray-500">
              Current account: <span className="font-semibold text-gray-800">{bankAccount.bankAccountName}</span>
              {" · "}{bankAccount.bankName}
              {" · "}****{bankAccount.bankAccountNumber?.slice(-4)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
