"use client";

import { useState, useRef } from "react";
import { useSession } from "@/lib/auth-stub";
import {
  ShieldCheck, Upload, User, Home, FileText,
  CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Loader2,
} from "lucide-react";

type Step = 1 | 2 | 3 | 4;

interface FormState {
  phoneNumber:      string;
  governmentIdUrl:  string;
  selfieUrl:        string;
  isDirectOwner:    boolean | null;
  landlordAware:    boolean | null;
  ownershipProofUrl: string;
}

const STEPS = [
  { id: 1, label: "Identity",    icon: User },
  { id: 2, label: "Property",    icon: Home },
  { id: 3, label: "Proof",       icon: FileText },
  { id: 4, label: "Review",      icon: ShieldCheck },
];

export default function VerificationPage() {
  const { update } = useSession();
  const [step, setStep]         = useState<Step>(1);
  const [form, setForm]         = useState<FormState>({
    phoneNumber:       "",
    governmentIdUrl:   "",
    selfieUrl:         "",
    isDirectOwner:     null,
    landlordAware:     null,
    ownershipProofUrl: "",
  });
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [done, setDone]               = useState(false);

  const govIdRef      = useRef<HTMLInputElement>(null);
  const selfieRef     = useRef<HTMLInputElement>(null);
  const ownershipRef  = useRef<HTMLInputElement>(null);

  // ── File upload helper ──────────────────────────────────────
  async function uploadFile(
    file: File,
    category: string,
    field: keyof FormState,
  ) {
    setUploading(field);
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);
    try {
      const res  = await fetch("/api/uploads", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Upload failed");
      setForm((f) => ({ ...f, [field]: json.data.url }));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(null);
    }
  }

  // ── Step validation ─────────────────────────────────────────
  function canProceed(): boolean {
    if (step === 1) return form.phoneNumber.trim().length >= 8 && !!form.governmentIdUrl && !!form.selfieUrl;
    if (step === 2) return form.isDirectOwner !== null && (form.isDirectOwner || form.landlordAware === true);
    if (step === 3) return !!form.ownershipProofUrl;
    return true;
  }

  // ── Submit ──────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res  = await fetch("/api/landlord/verification", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Submission failed");
      await update({ verificationStatus: "UNDER_REVIEW" });
      setDone(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Done state ──────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Documents Submitted!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Our team will review your documents within 24–48 hours and notify you by email.
            You can still use your dashboard and add listings in the meantime.
          </p>
          <button
            onClick={() => { window.location.href = "/landlord"; }}
            className="w-full bg-[#E67E22] hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Landlord Verification</h1>
          <p className="text-gray-500 text-sm mt-1">
            Complete all steps so we can verify your identity and property. Takes about 5 minutes.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon    = s.icon;
            const active  = step === s.id;
            const done    = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 flex-1 ${i > 0 ? "" : ""}`}>
                  {i > 0 && (
                    <div className={`h-0.5 flex-1 rounded ${done || active ? "bg-[#E67E22]" : "bg-gray-200"}`} />
                  )}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    done    ? "bg-[#E67E22] text-white" :
                    active  ? "bg-orange-100 text-[#E67E22] ring-2 ring-[#E67E22]" :
                              "bg-gray-100 text-gray-400"
                  }`}>
                    {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* ── Step 1: Identity ───────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Your Identity</h2>
                <p className="text-sm text-gray-500 mt-1">We need to confirm who you are.</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 08012345678"
                  value={form.phoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <p className="text-xs text-gray-400 mt-1">Use the phone number you or the landlord can be reached on.</p>
              </div>

              {/* Government ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Government-Issued ID <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  National ID (NIN slip), Driver&apos;s Licence, Voter&apos;s Card, or International Passport. Must be valid and clearly readable.
                </p>
                <input ref={govIdRef} type="file" accept="image/*,.pdf" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0], "governmentId", "governmentIdUrl"); }} />
                <button
                  onClick={() => govIdRef.current?.click()}
                  disabled={!!uploading}
                  className="flex items-center gap-2 border-2 border-dashed border-gray-200 hover:border-orange-300 rounded-xl px-4 py-3 text-sm text-gray-500 w-full transition-colors"
                >
                  {uploading === "governmentIdUrl" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {form.governmentIdUrl ? "✓ ID uploaded — click to replace" : "Upload ID document"}
                </button>
              </div>

              {/* Selfie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo of Yourself Holding the ID <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Take a clear selfie holding your ID open next to your face. This confirms it&apos;s your document.
                </p>
                <input ref={selfieRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0], "selfie", "selfieUrl"); }} />
                <button
                  onClick={() => selfieRef.current?.click()}
                  disabled={!!uploading}
                  className="flex items-center gap-2 border-2 border-dashed border-gray-200 hover:border-orange-300 rounded-xl px-4 py-3 text-sm text-gray-500 w-full transition-colors"
                >
                  {uploading === "selfieUrl" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {form.selfieUrl ? "✓ Selfie uploaded — click to replace" : "Upload selfie with ID"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Property Relationship ─────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Your Relationship to the Property</h2>
                <p className="text-sm text-gray-500 mt-1">Help us understand your connection to the housing you&apos;re listing.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Are you the direct owner of the property (or properties) you will list? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: true,  label: "Yes, I own it",          desc: "I am the property owner" },
                    { val: false, label: "No, I&apos;m acting on behalf", desc: "I&apos;m helping a landlord list" },
                  ].map(({ val, label, desc }) => (
                    <button
                      key={String(val)}
                      onClick={() => setForm((f) => ({ ...f, isDirectOwner: val, landlordAware: val ? true : null }))}
                      className={`text-left p-4 rounded-xl border-2 transition-colors ${
                        form.isDirectOwner === val
                          ? "border-[#E67E22] bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900">{label.replaceAll("&apos;", "'")}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{desc.replaceAll("&apos;", "'")}</p>
                    </button>
                  ))}
                </div>
              </div>

              {form.isDirectOwner === false && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
                  <p className="text-sm font-medium text-amber-800">
                    Since you are acting on behalf of a landlord, please confirm:
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Does the landlord know you are listing their property on RentalHub? <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { val: true,  label: "Yes, they know",    desc: "The landlord consented" },
                        { val: false, label: "No / Not sure",     desc: "They don't know" },
                      ].map(({ val, label, desc }) => (
                        <button
                          key={String(val)}
                          onClick={() => setForm((f) => ({ ...f, landlordAware: val }))}
                          className={`text-left p-4 rounded-xl border-2 transition-colors ${
                            form.landlordAware === val
                              ? val ? "border-green-500 bg-green-50" : "border-red-400 bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <p className="font-medium text-sm text-gray-900">{label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                        </button>
                      ))}
                    </div>
                    {form.landlordAware === false && (
                      <div className="mt-3 flex items-start gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Listing a property without the landlord&apos;s knowledge is not allowed on RentalHub. Please get their consent before proceeding.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Proof of Ownership / Authorisation ──────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Proof the Property is Legitimate</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Upload <strong>at least one</strong> of the following documents:
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  { title: "Certificate of Occupancy (C of O)",       desc: "Issued by the state government, confirming legal ownership." },
                  { title: "Deed of Assignment",                       desc: "Legal document transferring property ownership." },
                  { title: "Survey Plan",                              desc: "Surveys the land boundaries of the property." },
                  { title: "Right of Occupancy (R of O)",             desc: "Government-granted right to occupy land." },
                  { title: "Tenancy / Rent Agreement",                 desc: "If sub-letting — your agreement with the property owner." },
                  { title: "Signed Letter from the Landlord",         desc: "If acting on behalf — a letter authorising you to list." },
                  { title: "Landlord's ID + verbal confirmation",      desc: "A photo of the landlord's ID alongside a note they're aware of the listing." },
                ].map((doc) => (
                  <div key={doc.title} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-[#E67E22] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{doc.title}</p>
                      <p className="text-xs text-gray-400">{doc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <input ref={ownershipRef} type="file" accept="image/*,.pdf" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0], "ownershipProof", "ownershipProofUrl"); }} />
                <button
                  onClick={() => ownershipRef.current?.click()}
                  disabled={!!uploading}
                  className="flex items-center gap-2 border-2 border-dashed border-gray-200 hover:border-orange-300 rounded-xl px-4 py-4 text-sm text-gray-500 w-full transition-colors"
                >
                  {uploading === "ownershipProofUrl" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {form.ownershipProofUrl
                    ? "✓ Document uploaded — click to replace"
                    : "Upload proof document (PDF, JPG, or PNG)"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Review & Submit ────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>
                <p className="text-sm text-gray-500 mt-1">Check your information before submitting.</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Phone number",     value: form.phoneNumber,       ok: !!form.phoneNumber },
                  { label: "Government ID",    value: "Uploaded",             ok: !!form.governmentIdUrl },
                  { label: "Selfie with ID",   value: "Uploaded",             ok: !!form.selfieUrl },
                  { label: "Ownership type",   value: form.isDirectOwner ? "Direct owner" : "Acting on landlord's behalf", ok: form.isDirectOwner !== null },
                  { label: "Landlord aware",   value: form.isDirectOwner ? "N/A (direct owner)" : form.landlordAware ? "Yes" : "—", ok: form.isDirectOwner || !!form.landlordAware },
                  { label: "Ownership proof",  value: "Uploaded",             ok: !!form.ownershipProofUrl },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">{row.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{row.value}</span>
                      {row.ok
                        ? <CheckCircle className="w-4 h-4 text-green-500" />
                        : <AlertCircle className="w-4 h-4 text-red-400" />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
                By submitting, you confirm that all information and documents provided are genuine.
                Providing false information may result in permanent suspension from RentalHub.
              </div>

              {submitError && (
                <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* Upload error */}
          {uploadError && (
            <div className="mt-4 flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {uploadError}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
              disabled={step === 1}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < 4 ? (
              <button
                onClick={() => { if (canProceed()) setStep((s) => ((s + 1) as Step)); }}
                disabled={!canProceed() || !!uploading}
                className="flex items-center gap-1 bg-[#E67E22] hover:bg-orange-600 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 bg-[#192F59] hover:bg-blue-900 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Submit for Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
