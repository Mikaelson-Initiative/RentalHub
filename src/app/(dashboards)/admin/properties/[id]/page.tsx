import Link from "next/link";
import ReviewActions from "./ReviewActions";

// NOTE: Admin review data is served by the backend API (separate repo).
// This page renders the UI shell with placeholder content until the API is wired up.

interface AdminPropertyReviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface MediaItem {
  id: string;
  type: string;
  name: string;
  url?: string;
  mimeType?: string;
  size?: number;
}

const isPdfFile = (mediaItem: MediaItem) =>
  mediaItem.mimeType === "application/pdf" || mediaItem.url?.toLowerCase().endsWith(".pdf");

const isVideoFile = (mediaItem: MediaItem) =>
  mediaItem.type === "video" || mediaItem.mimeType?.startsWith("video/");

const isImageFile = (mediaItem: MediaItem) =>
  mediaItem.type === "image" || mediaItem.mimeType?.startsWith("image/");

const safeHttpUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
  } catch {
    // noop
  }
  return undefined;
};

export default async function AdminPropertyReviewPage({ params }: AdminPropertyReviewPageProps) {
  const { id } = await params;

  // Placeholder content — replace with a call to the backend API.
  const property = {
    id,
    title: "Listing details unavailable",
    status: "PENDING" as "PENDING" | "APPROVED" | "REJECTED",
    location: { name: "—" },
    price: 0,
    distanceToCampus: null as number | null,
    _count: { bookings: 0 },
    landlord: { name: "—", email: "—", verificationStatus: "UNVERIFIED" as const },
    createdAt: new Date().toISOString(),
    description:
      "Listing details are served by the backend API, which lives in a separate repository.",
    reviewedAt: null as string | null,
    reviewedBy: null as { name: string; email: string } | null,
    reviewNote: null as string | null,
  };

  const amenities: unknown[] = [];
  const rawImages: unknown[] = [];

  const mediaItems: MediaItem[] = rawImages.map((item, index) => {
    if (typeof item === "string") {
      return {
        id: `media-${index}`,
        type: "image",
        name: `image-${index + 1}`,
        url: safeHttpUrl(item),
      };
    }

    if (typeof item === "object" && item !== null) {
      const typedItem = item as {
        type?: string;
        name?: string;
        url?: string;
        mimeType?: string;
        size?: number;
      };
      return {
        id: `media-${index}`,
        type: typedItem.type || "file",
        name: typedItem.name || `file-${index + 1}`,
        url: safeHttpUrl(typedItem.url),
        mimeType: typedItem.mimeType,
        size: typedItem.size,
      };
    }

    return {
      id: `media-${index}`,
      type: "file",
      name: `file-${index + 1}`,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/admin" className="text-sm text-[#E67E22] hover:underline">
          Back to Admin Queue
        </Link>

        <div className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-[#192F59]">{property.title}</h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                property.status === "APPROVED"
                  ? "bg-green-100 text-green-800"
                  : property.status === "PENDING"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {property.status}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <p>
                <span className="font-semibold text-gray-800">Location:</span> {property.location.name}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Price:</span>{" "}
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  maximumFractionDigits: 0,
                }).format(Number(property.price))}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Distance to campus:</span>{" "}
                {property.distanceToCampus ? `${property.distanceToCampus} km` : "Not provided"}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Bookings:</span> {property._count.bookings}
              </p>
            </div>
            <div className="space-y-2">
              <p>
                <span className="font-semibold text-gray-800">Landlord:</span> {property.landlord.name}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Email:</span> {property.landlord.email}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Landlord Status:</span>{" "}
                {property.landlord.verificationStatus}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Submitted:</span>{" "}
                {new Date(property.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-base font-semibold text-[#192F59]">Description</h2>
            <p className="mt-2 text-gray-700 whitespace-pre-line">{property.description}</p>
          </div>

          <div className="mt-6">
            <h2 className="text-base font-semibold text-[#192F59]">Amenities</h2>
            {amenities.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No amenities provided.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {amenities.map((amenity, index) => (
                  <span key={`${amenity}-${index}`} className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full">
                    {String(amenity)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-base font-semibold text-[#192F59]">Review History</h2>
            {property.reviewedAt ? (
              <div className="mt-2 text-sm text-gray-700 space-y-1">
                <p>
                  Last reviewed: {new Date(property.reviewedAt).toLocaleString()}
                </p>
                {property.reviewedBy && (
                  <p>
                    Reviewed by: {property.reviewedBy.name} ({property.reviewedBy.email})
                  </p>
                )}
                {property.reviewNote && <p>Note: {property.reviewNote}</p>}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No review decision has been recorded yet.</p>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-base font-semibold text-[#192F59]">Uploaded Media</h2>
            {mediaItems.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No file metadata available.</p>
            ) : (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {mediaItems.map((mediaItem) => (
                  <div key={mediaItem.id} className="rounded-md border border-gray-200 p-3">
                    {mediaItem.url && isImageFile(mediaItem) ? (
                      <img
                        src={mediaItem.url}
                        alt={mediaItem.name}
                        className="w-full h-44 object-cover rounded-md border border-gray-100"
                      />
                    ) : mediaItem.url && isVideoFile(mediaItem) ? (
                      <video
                        src={mediaItem.url}
                        controls
                        preload="metadata"
                        className="w-full h-44 rounded-md border border-gray-100 bg-black"
                      >
                        Your browser does not support video playback.
                      </video>
                    ) : mediaItem.url && isPdfFile(mediaItem) ? (
                      <iframe
                        src={mediaItem.url}
                        title={mediaItem.name}
                        className="w-full h-44 rounded-md border border-gray-100 bg-white"
                      />
                    ) : (
                      <div className="h-44 rounded-md border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-xs text-gray-500 px-3 text-center">
                        Preview unavailable
                      </div>
                    )}
                    <div className="mt-2 text-sm text-gray-700">
                      <p className="font-medium">{mediaItem.name}</p>
                      <p className="text-gray-500">
                        {mediaItem.type}
                        {mediaItem.mimeType ? ` • ${mediaItem.mimeType}` : ""}
                        {typeof mediaItem.size === "number" ? ` • ${(mediaItem.size / 1024).toFixed(1)} KB` : ""}
                      </p>
                      {mediaItem.url && (
                        <div className="mt-1 flex items-center gap-3">
                          <a
                            href={mediaItem.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#E67E22] hover:underline"
                          >
                            Open file
                          </a>
                          <a
                            href={mediaItem.url}
                            download
                            className="text-[#192F59] hover:underline"
                          >
                            Download
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ReviewActions propertyId={property.id} />
        </div>
      </div>
    </div>
  );
}
