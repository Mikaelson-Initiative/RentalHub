import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Available Properties",
  description:
    "Browse all verified off-campus accommodation across Nigeria. Filter by location and find your perfect student room or apartment.",
  openGraph: {
    title: "Available Properties | RentalHub",
    description:
      "Browse all verified off-campus accommodation across Nigeria. Filter by location and find your perfect student room or apartment.",
    url: "https://rentalhub.ng/properties",
  },
};

interface PropertiesPageProps {
  searchParams?: Promise<{
    location?: string;
    school?: string;
  }>;
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const schoolFilter = resolvedSearchParams?.school?.trim() || "";
  const locationFilter = resolvedSearchParams?.location?.trim() || "";
  const activeFilter = schoolFilter || locationFilter;

  // Listings are served by the backend API (separate repo). Until that is
  // wired up, this page renders the filter UI with no results.
  interface PropertyListItem {
    id: string;
    title: string;
    description: string;
    price: number;
    vacantUnits: number;
    images: unknown;
    location: { name: string };
  }
  const properties: PropertyListItem[] = [];

  /** Extract the first uploaded image URL from a property's images JSON field */
  function getFirstUploadedImage(images: unknown): string | null {
    if (!Array.isArray(images)) return null;
    for (const item of images) {
      if (typeof item === "string") return item;
      if (
        typeof item === "object" &&
        item !== null &&
        "url" in item &&
        typeof (item as { url: unknown }).url === "string"
      ) {
        const typed = item as { url: string; type?: string };
        // Only use image-type uploads, not videos or docs
        if (!typed.type || typed.type === "image") return typed.url;
      }
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#192F59]">Available Properties</h1>
          <p className="text-gray-600 mt-2">
            Browse verified off-campus accommodation across Nigeria.
          </p>
          {activeFilter && (
            <div className="mt-3 flex items-center gap-3">
              <span className="inline-flex items-center bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-3 py-1 text-xs font-medium">
                {schoolFilter ? `School: ${schoolFilter}` : `Location: ${locationFilter}`}
              </span>
              <Link href="/properties" className="text-xs text-[#192F59] hover:text-[#E67E22] transition-colors">
                Clear filter
              </Link>
            </div>
          )}
        </div>

        {properties.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <p className="text-gray-600">
              {activeFilter
                ? `No approved properties found for ${schoolFilter || locationFilter}.`
                : "No approved properties are available yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              const isFullyBooked = property.vacantUnits <= 0;
              return (
                <div key={property.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="relative h-48 bg-gray-100">
                    {(() => {
                      const uploadedSrc = getFirstUploadedImage(property.images);
                      return uploadedSrc ? (
                        <Image
                          src={uploadedSrc}
                          alt={property.title}
                          fill
                          className={`object-cover${isFullyBooked ? " opacity-60" : ""}`}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-10 h-10 text-gray-300" />
                        </div>
                      );
                    })()}
                    {isFullyBooked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-red-600 text-white text-sm font-bold px-5 py-2 rounded-full shadow-lg tracking-wide">
                          Fully Booked
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-gray-500">{property.location.name}</p>
                    <h2 className="text-lg font-semibold text-[#192F59] mt-1">{property.title}</h2>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{property.description}</p>

                    <div className="mt-4 flex items-center justify-between">
                      <p className={`font-bold text-xl ${isFullyBooked ? "text-gray-400" : "text-[#00A553]"}`}>
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: "NGN",
                          maximumFractionDigits: 0,
                        }).format(Number(property.price))}
                      </p>
                      {isFullyBooked ? (
                        <span className="text-red-600 text-sm font-semibold border border-red-200 bg-red-50 px-4 py-2 rounded-lg">
                          Not Available
                        </span>
                      ) : (
                        <Link
                          href={`/properties/${property.id}`}
                          className="bg-[#192F59] hover:bg-[#0f1d3a] text-white text-sm px-4 py-2 rounded-lg transition-colors"
                        >
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
