"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "@/lib/auth-stub";
import { upload } from "@vercel/blob/client";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Home, 
  MapPin, 
  Wallet, 
  Camera,
  Upload,
  Video,
  FileText,
  Droplets,
  Zap,
  Shield,
  Box
} from "lucide-react";
import Link from "next/link";
import { SCHOOL_OPTIONS } from "@/lib/schools";

// Validation Schema
const toNumber = (value: unknown) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? undefined : numericValue;
};

const propertySchema = z.object({
  // Step 1: Core Details
  title: z.string().min(3, "Title must be at least 3 characters"),
  propertyType: z.string().min(1, "Please select a property type"),
  vacantUnits: z.preprocess(toNumber, z.number().min(1, "At least 1 unit required")),
  genderPreference: z.string().min(1, "Please select gender preference"),
  
  // Step 2: Location & Amenities
  targetUniversity: z.string(),
  environment: z.string().min(2, "Please enter an environment/area"),
  distanceToCampus: z.string().min(1, "Please select distance"),
  amenities: z.object({
    water: z.array(z.string()),
    power: z.array(z.string()),
    security: z.array(z.string()),
    facilities: z.array(z.string()),
  }),
  
  // Step 3: Financials
  annualRent: z.preprocess(toNumber, z.number().min(1, "Annual rent is required")),
  agencyFee: z.preprocess(toNumber, z.number().min(0, "Agency fee cannot be negative")),
  cautionFee: z.preprocess(toNumber, z.number().min(0, "Caution fee cannot be negative")),
  serviceCharge: z.preprocess(toNumber, z.number().min(0, "Service charge cannot be negative").optional()),
  
  // Step 4: Media & Proof
  landmarkDirections: z.string().min(10, "Please provide landmark directions"),
  photos: z.any().optional(),
  video: z.any().optional(),
  verificationDoc: z.any().optional(),
});

type PropertyFormInput = z.input<typeof propertySchema>;
type PropertyFormData = z.output<typeof propertySchema>;

const steps = [
  { id: 1, name: "Core Details", icon: Home },
  { id: 2, name: "Location & Amenities", icon: MapPin },
  { id: 3, name: "Financials", icon: Wallet },
  { id: 4, name: "Media & Proof", icon: Camera },
];

const propertyTypes = [
  { value: "single_room", label: "Single Room" },
  { value: "self_contain", label: "Self-Contain" },
  { value: "1_bedroom", label: "1-Bedroom Flat" },
  { value: "2_bedroom", label: "2-Bedroom Flat" },
];

const genderOptions = [
  { value: "any", label: "Any" },
  { value: "male", label: "Male Only" },
  { value: "female", label: "Female Only" },
];

const distanceOptions = [
  { value: "under_10", label: "Under 10 mins walk" },
  { value: "15_20", label: "15-20 mins walk" },
  { value: "bike_cab", label: "Requires Bike/Cab" },
];

const DISTANCE_TO_KM: Record<string, number> = {
  under_10: 0.8,
  "15_20": 1.5,
  bike_cab: 3.0,
};

const amenityCategories = {
  water: {
    icon: Droplets,
    label: "Water",
    options: ["Borehole", "Well", "Pumping Machine"],
  },
  power: {
    icon: Zap,
    label: "Power",
    options: ["Prepaid Meter (Per Room)", "Shared Prepaid Meter", "Estimated Billing"],
  },
  security: {
    icon: Shield,
    label: "Security",
    options: ["Fenced & Gated", "Night Watchman"],
  },
  facilities: {
    icon: Box,
    label: "Facilities",
    options: ["Tiled Floors", "Wardrobe", "Kitchen Cabinet"],
  },
};

export default function AddPropertyForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [aiDescLoading, setAiDescLoading] = useState(false);
  const [aiDescError, setAiDescError] = useState("");
  const [priceAdvisor, setPriceAdvisor] = useState<{ min: number; max: number; median: number; count: number; insight: string } | null>(null);
  const [priceAdvisorLoading, setPriceAdvisorLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedVerificationDoc, setSelectedVerificationDoc] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const verificationInputRef = useRef<HTMLInputElement>(null);
  const verificationStatus = (session?.user as { verificationStatus?: string } | undefined)?.verificationStatus;
  const listingLocked = session?.user?.role === "LANDLORD" && verificationStatus !== "VERIFIED";

  const methods = useForm<PropertyFormInput, unknown, PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      targetUniversity: "BOUESTI - Ikere-Ekiti",
      vacantUnits: 1,
      amenities: {
        water: [],
        power: [],
        security: [],
        facilities: [],
      },
      agencyFee: 0,
      cautionFee: 0,
    },
    mode: "onChange",
  });

  const { register, handleSubmit, formState: { errors }, trigger, watch, setValue, setError, clearErrors } = methods;

  const watchAmenities = watch("amenities");

  const generateDescription = async () => {
    const values = methods.getValues();
    setAiDescLoading(true);
    setAiDescError("");
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          propertyType: values.propertyType,
          distanceToCampus: values.distanceToCampus,
          genderPreference: values.genderPreference,
          amenities: [
            ...(values.amenities?.water ?? []),
            ...(values.amenities?.power ?? []),
            ...(values.amenities?.security ?? []),
            ...(values.amenities?.facilities ?? []),
          ],
          annualRent: values.annualRent,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to generate");
      setAiDescription(json.data.description);
    } catch (e) {
      setAiDescError(e instanceof Error ? e.message : "AI generation failed");
    } finally {
      setAiDescLoading(false);
    }
  };

  const loadPriceAdvisor = async () => {
    const values = methods.getValues();
    if (!values.environment) return;
    setPriceAdvisorLoading(true);
    try {
      const res = await fetch(`/api/ai/price-advisor?locationName=${encodeURIComponent(values.environment)}&propertyType=${encodeURIComponent(values.propertyType || "")}`);
      const json = await res.json();
      if (res.ok && json.success) setPriceAdvisor(json.data);
    } catch { /* silent */ }
    finally { setPriceAdvisorLoading(false); }
  };

  useEffect(() => {
    if (currentStep === 3) loadPriceAdvisor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  /**
   * Images go through the server route (needs AI + hash analysis).
   * Videos and documents go directly to Vercel Blob from the browser
   * to avoid the 4.5 MB serverless body limit.
   */
  const uploadFile = async (
    file: File,
    category: "image" | "video" | "verificationDocument",
  ) => {
    const withTimeout = async <T,>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), ms);
      });
      return Promise.race([promise, timeoutPromise]);
    };

    if (category === "video" || category === "verificationDocument") {
      // Pre-validate size before hitting the upload service
      const limitBytes = category === "video" ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
      const limitLabel = category === "video" ? "100 MB" : "5 MB";
      if (file.size > limitBytes) {
        throw new Error(`${file.name} is too large. The maximum allowed size for ${category === "video" ? "videos" : "documents"} is ${limitLabel}.`);
      }

      // Client-side upload — browser → storage directly
      let blob;
      try {
        blob = await withTimeout(
          upload(`uploads/${category}/${Date.now()}-${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/uploads/client-token",
          }),
          60_000,
          `${file.name} upload timed out. Please retry.`,
        );
      } catch (uploadError) {
        const raw = uploadError instanceof Error ? uploadError.message : String(uploadError);
        // Sanitise storage-provider error messages before showing them to the user
        if (/too large|file length|maximum.*size|size.*exceed|bytes/i.test(raw)) {
          throw new Error(`${file.name} is too large. The maximum allowed size is ${limitLabel}.`);
        }
        if (/content.?type|mime|not allowed/i.test(raw)) {
          throw new Error(`${file.name} has an unsupported file type. Please upload a valid ${category === "video" ? "video (MP4, WebM, MOV)" : "document (PDF)"}.`);
        }
        throw new Error(`${file.name} could not be uploaded. Please try again.`);
      }

      return {
        name: file.name,
        type: category,
        mimeType: file.type,
        size: file.size,
        url: blob.url,
      };
    }

    // Images: server route (AI analysis + duplicate hash check)
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    const response = await withTimeout(
      fetch("/api/uploads", {
        method: "POST",
        body: formData,
      }),
      60_000,
      `${file.name} upload timed out. Please retry.`,
    );

    const payload = await response.json();
    if (!response.ok || !payload?.success || !payload?.data) {
      const raw = payload?.error ?? `Failed to upload ${file.name}`;
      // Sanitise any storage-provider details from the error message
      if (/too large|file length|maximum.*size|size.*exceed|bytes/i.test(raw)) {
        throw new Error(`${file.name} is too large. The maximum allowed size for photos is 2 MB.`);
      }
      throw new Error(raw);
    }

    return payload.data as {
      name: string;
      type: string;
      mimeType: string;
      size: number;
      url: string;
    };
  };

  const toggleAmenity = (category: keyof typeof amenityCategories, option: string) => {
    const current = watchAmenities?.[category] || [];
    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];
    setValue(`amenities.${category}`, updated, { shouldValidate: true });
  };

  const validateStep = async () => {
    let fieldsToValidate: string[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ["title", "propertyType", "vacantUnits", "genderPreference"];
        break;
      case 2:
        fieldsToValidate = ["environment", "distanceToCampus"];
        break;
      case 3:
        fieldsToValidate = ["annualRent", "agencyFee", "cautionFee"];
        break;
      case 4:
        fieldsToValidate = ["landmarkDirections"];
        break;
    }
    
    const result = await trigger(fieldsToValidate as Array<keyof PropertyFormInput>);
    return result;
  };

  const handleNext = async () => {
    const isStepValid = await validateStep();
    if (isStepValid && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const MAX_PHOTO_SIZE_MB = 2;
  const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;
  const MAX_PHOTO_COUNT = 10;
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  const handlePhotoSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    const oversized = files.filter((f) => f.size > MAX_PHOTO_SIZE_BYTES);
    if (oversized.length > 0) {
      setError("photos", {
        type: "manual",
        message: `Each photo must be under ${MAX_PHOTO_SIZE_MB} MB. Remove: ${oversized.map((f) => f.name).join(", ")}`,
      });
      return;
    }

    const invalidType = files.filter((f) => !ALLOWED_IMAGE_TYPES.includes(f.type));
    if (invalidType.length > 0) {
      setError("photos", {
        type: "manual",
        message: `Only JPEG, PNG, WebP, or GIF images are allowed.`,
      });
      return;
    }

    if (files.length > MAX_PHOTO_COUNT) {
      setError("photos", {
        type: "manual",
        message: `Maximum ${MAX_PHOTO_COUNT} photos allowed.`,
      });
      return;
    }

    setSelectedPhotos(files);
    setValue("photos", files, { shouldValidate: true });
    clearErrors("photos");
  };

  const handleVideoSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedVideo(file);
    setValue("video", file, { shouldValidate: true });
  };

  const handleVerificationDocSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedVerificationDoc(file);
    setValue("verificationDoc", file, { shouldValidate: true });
  };

  const onSubmit = async (data: PropertyFormData) => {
    setSubmitError("");

    if (listingLocked) {
      setSubmitError("Your account must be verified by admin before you can submit listings.");
      return;
    }

    if (selectedPhotos.length === 0) {
      setError("photos", {
        type: "manual",
        message: "Please upload at least one property photo.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const imagePayload = await Promise.all(
        selectedPhotos.map((file) => uploadFile(file, "image")),
      );
      const videoPayload = selectedVideo ? await uploadFile(selectedVideo, "video") : null;
      const verificationDocPayload = selectedVerificationDoc
        ? await uploadFile(selectedVerificationDoc, "verificationDocument")
        : null;

      const amenities = [
        ...data.amenities.water,
        ...data.amenities.power,
        ...data.amenities.security,
        ...data.amenities.facilities,
      ];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          title: data.title,
          description: aiDescription.trim() ||
            [
              `Type: ${data.propertyType}`,
              `Units: ${data.vacantUnits}`,
              `Gender Preference: ${data.genderPreference}`,
              `Landmark: ${data.landmarkDirections}`,
              `Fees: Agency ₦${data.agencyFee}, Caution ₦${data.cautionFee}${data.serviceCharge !== undefined ? `, Service ₦${data.serviceCharge}` : ""}`,
            ]
              .filter(Boolean)
              .join("\n"),
          price: data.annualRent,
          locationName: data.environment,
          distanceToCampus: DISTANCE_TO_KM[data.distanceToCampus] ?? null,
          amenities,
          images: [
            ...imagePayload,
            ...(videoPayload ? [videoPayload] : []),
            ...(verificationDocPayload ? [verificationDocPayload] : []),
          ],
        }),
      });
      clearTimeout(timeoutId);

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Could not submit listing.");
      }

      router.push("/landlord");
      router.refresh();
    } catch (error) {
      console.error("Listing submission failed:", error);
      setSubmitError(error instanceof Error ? error.message : "An error occurred while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepIcon = steps[currentStep - 1].icon;

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/landlord"
              className="inline-flex items-center text-gray-600 hover:text-orange-500 transition-colors mb-4"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">List Your Property</h1>
            <p className="text-gray-600 mt-2">
              Complete the form below to add your property to RentalHub
            </p>
          </div>

          {/* Progress Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors ${
                          isActive
                            ? "bg-orange-500 text-white"
                            : isCompleted
                            ? "bg-gray-900 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4 sm:w-6 sm:h-6" />
                        ) : (
                          <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        )}
                      </div>
                      {/* Step label: show only active/completed label on mobile to save space */}
                      <span
                        className={`mt-1.5 text-xs font-medium text-center leading-tight max-w-[60px] sm:max-w-none ${
                          isActive
                            ? "text-orange-500"
                            : isCompleted
                            ? "text-gray-900"
                            : "text-gray-400 hidden sm:block"
                        }`}
                      >
                        {step.name}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-2 sm:mx-4 transition-colors ${
                          isCompleted ? "bg-gray-900" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Mobile: show current step name below stepper */}
            <p className="sm:hidden text-center text-sm font-medium text-orange-500 mt-3">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].name}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Step Header */}
            <div className="bg-gray-50 px-4 py-4 sm:px-8 sm:py-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <StepIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {steps[currentStep - 1].name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Step {currentStep} of {steps.length}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-8">
              {listingLocked && (
                <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  Listing is locked until your landlord verification is approved by admin.
                </p>
              )}
              {/* Step 1: Core Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Listing Title *
                    </label>
                    <input
                      {...register("title")}
                      type="text"
                      placeholder="e.g., Akolade Villa"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Type *
                      </label>
                      <select
                        {...register("propertyType")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select type</option>
                        {propertyTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.propertyType && (
                        <p className="mt-1 text-sm text-red-500">{errors.propertyType.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vacant Units *
                      </label>
                      <input
                        {...register("vacantUnits")}
                        type="number"
                        min="1"
                        placeholder="1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      />
                      {errors.vacantUnits && (
                        <p className="mt-1 text-sm text-red-500">{errors.vacantUnits.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender Preference *
                    </label>
                    <select
                      {...register("genderPreference")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select preference</option>
                      {genderOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.genderPreference && (
                      <p className="mt-1 text-sm text-red-500">{errors.genderPreference.message}</p>
                    )}
                  </div>

                  {/* AI Description Generator */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Property Description <span className="text-gray-400">(Optional — AI can write this for you)</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateDescription}
                        disabled={aiDescLoading}
                        className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-all"
                      >
                        {aiDescLoading ? (
                          <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Generating...</>
                        ) : (
                          <>&#10024; AI Generate</>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      rows={4}
                      placeholder="Describe your property — location highlights, what makes it ideal for students, special features..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                    />
                    {aiDescError && <p className="mt-1 text-sm text-red-500">{aiDescError}</p>}
                  </div>
                </div>
              )}

              {/* Step 2: Location & Amenities */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target University
                      </label>
                      <select
                        {...register("targetUniversity")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                      >
                        {SCHOOL_OPTIONS.map((school) => (
                          <option key={school.value} value={school.value}>
                            {school.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Environment/Area *
                      </label>
                      <input
                        {...register("environment")}
                        type="text"
                        placeholder="e.g., Odo Oja, Ikere-Ekiti"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      />
                      {errors.environment && (
                        <p className="mt-1 text-sm text-red-500">{errors.environment.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Distance to Campus *
                    </label>
                    <select
                      {...register("distanceToCampus")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select distance</option>
                      {distanceOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.distanceToCampus && (
                      <p className="mt-1 text-sm text-red-500">{errors.distanceToCampus.message}</p>
                    )}
                  </div>

                  {/* Amenities Grid */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Amenities</h3>
                    {Object.entries(amenityCategories).map(([key, category]) => {
                      const Icon = category.icon;
                      return (
                        <div key={key} className="bg-gray-50 rounded-xl p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Icon className="w-5 h-5 text-orange-500" />
                            <h4 className="font-medium text-gray-900">{category.label}</h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {category.options.map((option) => {
                              const isSelected = watchAmenities?.[key as keyof typeof watchAmenities]?.includes(option);
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => toggleAmenity(key as keyof typeof amenityCategories, option)}
                                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                                    isSelected
                                      ? "bg-orange-500 text-white shadow-md"
                                      : "bg-white text-gray-700 border border-gray-200 hover:border-orange-300"
                                  }`}
                                >
                                  {isSelected && <Check className="inline w-4 h-4 mr-2" />}
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Financials */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-orange-800">
                      <strong>Transparency Note:</strong> All fees are displayed to students upfront. No hidden charges allowed.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Annual Rent *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₦</span>
                        <input
                          {...register("annualRent")}
                          type="number"
                          placeholder="150000"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                      {errors.annualRent && (
                        <p className="mt-1 text-sm text-red-500">{errors.annualRent.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Agreement/Agency Fee *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₦</span>
                        <input
                          {...register("agencyFee")}
                          type="number"
                          placeholder="0"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                      {errors.agencyFee && (
                        <p className="mt-1 text-sm text-red-500">{errors.agencyFee.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Caution/Damage Fee *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₦</span>
                        <input
                          {...register("cautionFee")}
                          type="number"
                          placeholder="0"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                      {errors.cautionFee && (
                        <p className="mt-1 text-sm text-red-500">{errors.cautionFee.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Charge <span className="text-gray-400">(Optional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₦</span>
                        <input
                          {...register("serviceCharge")}
                          type="number"
                          placeholder="0"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Price Advisor */}
                  <div className="mt-2 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">&#x1F916;</span>
                      <h4 className="font-semibold text-indigo-900 text-sm">AI Rent Price Advisor</h4>
                      {priceAdvisorLoading && <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin inline-block" />}
                    </div>
                    {priceAdvisor ? (
                      <>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="bg-white rounded-lg p-3 text-center border border-indigo-100">
                            <p className="text-xs text-gray-500 mb-0.5">Lowest</p>
                            <p className="text-sm font-bold text-gray-900">&#x20A6;{priceAdvisor.min.toLocaleString("en-NG")}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center border border-indigo-200 ring-1 ring-indigo-300">
                            <p className="text-xs text-indigo-600 mb-0.5 font-medium">Median</p>
                            <p className="text-sm font-bold text-indigo-700">&#x20A6;{priceAdvisor.median.toLocaleString("en-NG")}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center border border-indigo-100">
                            <p className="text-xs text-gray-500 mb-0.5">Highest</p>
                            <p className="text-sm font-bold text-gray-900">&#x20A6;{priceAdvisor.max.toLocaleString("en-NG")}</p>
                          </div>
                        </div>
                        <p className="text-xs text-indigo-700 italic">{priceAdvisor.insight}</p>
                        <p className="text-xs text-gray-400 mt-1">Based on {priceAdvisor.count} similar listings in this area.</p>
                      </>
                    ) : (
                      <p className="text-xs text-indigo-600">
                        {priceAdvisorLoading ? "Loading market data..." : "Select a location in Step 2 to see market pricing data."}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Media & Proof */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {/* Landmark Directions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Closest Landmark Directions *
                    </label>
                    <textarea
                      {...register("landmarkDirections")}
                      rows={3}
                      placeholder="e.g., 3 houses down from Amoye Grammar School gate, opposite the blue mosque"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                    />
                    {errors.landmarkDirections && (
                      <p className="mt-1 text-sm text-red-500">{errors.landmarkDirections.message}</p>
                    )}
                  </div>

                  {/* Property Photos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Photos *
                    </label>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-500 transition-colors cursor-pointer bg-gray-50"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-700 font-medium mb-2">
                        Drag and drop photos here, or click to browse
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Must include at least one exterior/street-view photo to prove existence
                      </p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Upload className="w-4 h-4" />
                        Select Photos
                      </button>
                      <input
                        ref={photoInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoSelect}
                      />
                      {selectedPhotos.length > 0 && (
                        <p className="text-sm text-green-700 mt-3">
                          {selectedPhotos.length} photo(s) selected
                        </p>
                      )}
                    </div>
                    {errors.photos && (
                      <p className="mt-1 text-sm text-red-500">{String(errors.photos.message || "")}</p>
                    )}
                  </div>

                  {/* Video Walkthrough */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Video Walkthrough <span className="text-gray-400">(Optional)</span>
                    </label>
                    <div
                      className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-orange-400 transition-colors cursor-pointer bg-gray-50/50"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <Video className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 text-sm mb-2">
                        Upload a short video tour of the property
                      </p>
                      <p className="text-xs text-gray-400">
                        Max 2 minutes, MP4 format
                      </p>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoSelect}
                      />
                      {selectedVideo && (
                        <p className="text-sm text-green-700 mt-3">{selectedVideo.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Verification Document */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Verification Document
                    </label>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-500 transition-colors cursor-pointer bg-gray-50"
                      onClick={() => verificationInputRef.current?.click()}
                    >
                      <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-700 font-medium mb-2">
                        Upload Utility Bill or Property ID
                      </p>
                      <p className="text-sm text-orange-600 mb-3">
                        Kept private. Required for the Verified Landlord badge
                      </p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Upload className="w-4 h-4" />
                        Select Document
                      </button>
                      <input
                        ref={verificationInputRef}
                        type="file"
                        accept=".pdf,.jpg,.png"
                        className="hidden"
                        onChange={handleVerificationDocSelect}
                      />
                      {selectedVerificationDoc && (
                        <p className="text-sm text-green-700 mt-3">{selectedVerificationDoc.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {submitError}
                </p>
              )}
              <div className="flex justify-between pt-8 mt-8 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                    currentStep === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors"
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || listingLocked}
                    className="flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Submit Listing
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
