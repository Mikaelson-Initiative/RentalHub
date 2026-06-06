import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPropertyImage } from "@/lib/property-image";
import BookButton from "@/components/BookButton";

// NOTE: Property data is served by the backend API (separate repo). This page
// renders the UI shell with placeholder content until the API is wired up
// (e.g. fetch from `${process.env.NEXT_PUBLIC_API_URL}/properties/<id>`).

interface PropertyDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PropertyDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Property Details",
    description: "View property details on RentalHub Nigeria.",
    openGraph: {
      title: "Property Details | RentalHub",
      description: "View property details on RentalHub Nigeria.",
      url: `https://rentalhub.ng/properties/${id}`,
    },
  };
}

export default async function PropertyDetailsPage({ params }: PropertyDetailsPageProps) {
  const { id } = await params;

  // Placeholder content — replace with a call to the backend API.
  const property = {
    id,
    title: "Property details unavailable",
    description:
      "Property information is served by the backend API, which lives in a separate repository. Connect the API to display live listing details here.",
    price: 0,
    location: { name: "—" },
    landlord: { name: "—", verificationStatus: "UNVERIFIED" as const },
    vacantUnits: 0,
  };
  const amenities: string[] = [];
  const imageUrls: string[] = [];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/properties" className="text-sm text-[#E67E22] hover:underline">
          Back to properties
        </Link>

        <div className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="mb-6 relative h-72 rounded-xl overflow-hidden border border-gray-200">
            <Image
              src={imageUrls.length > 0 ? imageUrls[0] : getPropertyImage(property.id)}
              alt={property.title}
              fill
              className="object-cover"
              unoptimized={imageUrls.length > 0}
            />
          </div>

          <p className="text-sm text-gray-500">{property.location.name}</p>
          <h1 className="text-3xl font-bold text-[#192F59] mt-1">{property.title}</h1>
          <p className="text-[#00A553] text-2xl font-bold mt-3">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
              maximumFractionDigits: 0,
            }).format(Number(property.price))}
            <span className="text-sm font-medium text-gray-500 ml-1">/year</span>
          </p>

          <p className="text-gray-700 mt-6 leading-relaxed">{property.description}</p>

          {amenities.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-[#192F59] mb-3">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity, index) => (
                  <span key={`${amenity}-${index}`} className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full">
                    {String(amenity)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600">
              Listed by <span className="font-medium text-gray-900">{property.landlord.name}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">Verification: {property.landlord.verificationStatus}</p>
          </div>

          <BookButton
            propertyId={property.id}
            propertyPrice={Number(property.price)}
            existingBookingStatus={null}
            userRole={null}
            isFullyBooked={property.vacantUnits <= 0}
          />
        </div>
      </div>
    </div>
  );
}
