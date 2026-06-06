"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth-stub";
import { ShieldAlert, ShieldX, Clock, TrendingUp } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  price: number | string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  location: {
    name: string;
  };
  _count?: {
    bookings: number;
  };
}

interface BookingRequest {
  id: string;
  status: "PENDING" | "CONFIRMED" | "AWAITING_PAYMENT" | "PAID" | "CANCELLED" | "EXPIRED";
  bidAmount: number | null;
  createdAt: string;
  student: {
    name: string;
  };
  property: {
    id: string;
    title: string;
    price: number | string;
  };
}

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  totalPaidBookings: number;
  bookings: {
    id: string;
    propertyTitle: string;
    studentName: string;
    amount: number;
    paidAt: string | null;
    paystackRef: string | null;
    moveInDate: string | null;
    leaseEndDate: string | null;
  }[];
}

interface ListingsResponse {
  success: boolean;
  data?: {
    items: Listing[];
  };
  error?: string;
}

interface BookingsResponse {
  success: boolean;
  data?: BookingRequest[];
  error?: string;
}

function VerificationBanner({ status }: { status?: string }) {
  if (!status || status === "VERIFIED") return null;

  const config: Record<string, { icon: React.ReactNode; bg: string; text: string; cta: string | null; message: string }> = {
    UNVERIFIED: {
      icon: <ShieldAlert className="w-5 h-5 text-amber-600" />,
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-800",
      cta: "Complete Verification",
      message: "Your account is not yet verified. Complete verification so students can trust your listings.",
    },
    UNDER_REVIEW: {
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-800",
      cta: null,
      message: "Your documents are under review. We'll notify you by email within 24–48 hours.",
    },
    REJECTED: {
      icon: <ShieldX className="w-5 h-5 text-red-600" />,
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      cta: "Resubmit Documents",
      message: "Your verification was rejected. Please review the feedback and resubmit.",
    },
    SUSPENDED: {
      icon: <ShieldX className="w-5 h-5 text-red-600" />,
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      cta: null,
      message: "Your account has been suspended by an administrator. Contact support for more information.",
    },
  };

  const c = config[status];
  if (!c) return null;

  return (
    <div className={`flex items-start justify-between gap-4 border rounded-xl px-5 py-4 mb-6 ${c.bg}`}>
      <div className="flex items-start gap-3">
        {c.icon}
        <p className={`text-sm font-medium ${c.text}`}>{c.message}</p>
      </div>
      {c.cta && (
        <Link
          href="/landlord/verification"
          className="flex-shrink-0 text-xs font-semibold bg-white border border-current px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {c.cta}
        </Link>
      )}
    </div>
  );
}

export default function LandlordDashboard() {
  const { data: session } = useSession();
  const verificationStatus = (session?.user as { verificationStatus?: string })?.verificationStatus;
  const [activeTab, setActiveTab] = useState<"listings" | "requests" | "earnings">("listings");
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingRequestId, setUpdatingRequestId] = useState("");

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [listingsResponse, requestsResponse] = await Promise.all([
        fetch("/api/properties?mine=true&pageSize=50", { cache: "no-store" }),
        fetch("/api/bookings", { cache: "no-store" }),
      ]);

      const listingsPayload = (await listingsResponse.json()) as ListingsResponse;
      const requestsPayload = (await requestsResponse.json()) as BookingsResponse;

      if (!listingsResponse.ok || !listingsPayload.success) {
        throw new Error(listingsPayload.error || "Failed to load your listings.");
      }

      if (!requestsResponse.ok || !requestsPayload.success) {
        throw new Error(requestsPayload.error || "Failed to load tenant requests.");
      }

      setListings(listingsPayload.data?.items ?? []);
      setRequests(requestsPayload.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load landlord dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadEarnings = useCallback(async () => {
    if (earnings) return; // already loaded
    setEarningsLoading(true);
    try {
      const res = await fetch("/api/landlord/earnings", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success) setEarnings(json.data);
    } catch { /* silent */ }
    finally { setEarningsLoading(false); }
  }, [earnings]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (activeTab === "earnings") loadEarnings();
  }, [activeTab, loadEarnings]);

  const totalViews = useMemo(
    () => listings.reduce((acc, listing) => acc + (listing._count?.bookings ?? 0), 0),
    [listings],
  );

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === "PENDING" || r.status === "AWAITING_PAYMENT").length,
    [requests],
  );

  const formatPrice = (price: number | string) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Number(price));

  const updateRequestStatus = async (bookingId: string, status: "CONFIRMED" | "CANCELLED") => {
    setUpdatingRequestId(bookingId);
    setError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to update booking request.");
      }
      await loadDashboardData();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update booking request.");
    } finally {
      setUpdatingRequestId("");
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      AWAITING_PAYMENT: "bg-orange-100 text-orange-800",
      PAID: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
      EXPIRED: "bg-gray-100 text-gray-600",
    };
    return map[status] ?? "bg-gray-100 text-gray-600";
  };

  const bidAmountValue = (request: BookingRequest) => Number(request.bidAmount ?? request.property.price);

  const highestBidByProperty = useMemo(() => {
    const pendingGroups = requests.filter((request) => request.status === "PENDING").reduce<Record<string, BookingRequest[]>>((acc, request) => {
      acc[request.property.id] = acc[request.property.id] ? [...acc[request.property.id], request] : [request];
      return acc;
    }, {});

    return Object.fromEntries(
      Object.entries(pendingGroups).map(([propertyId, entries]) => [
        propertyId,
        {
          total: entries.length,
          maxBid: Math.max(...entries.map((entry) => bidAmountValue(entry))),
        },
      ]),
    );
  }, [requests]);

  const canAcceptRequest = (request: BookingRequest) => {
    const metrics = highestBidByProperty[request.property.id];
    if (!metrics || metrics.total < 2) return true;
    return bidAmountValue(request) >= metrics.maxBid;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy">Landlord Dashboard</h1>
          <p className="text-gray-600 mt-1 text-sm">Manage your listings and tenant requests</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/landlord/profile"
            className="border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            My Profile
          </Link>
          <Link
            href="/landlord/add-property"
            className="bg-[#E67E22] hover:bg-[#D35400] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
          >
            Add Property
          </Link>
        </div>
      </div>

      <VerificationBanner status={verificationStatus} />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-3xl font-bold text-primary-green">{listings.length}</div>
          <div className="text-gray-600">Total Listings</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-3xl font-bold text-primary-green">
            {listings.filter((listing) => listing.status === "APPROVED").length}
          </div>
          <div className="text-gray-600">Approved</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-3xl font-bold text-primary-green">{pendingRequests}</div>
          <div className="text-gray-600">Pending Requests</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-3xl font-bold text-primary-green">{totalViews}</div>
          <div className="text-gray-600">Total Booking Requests</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("listings")}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === "listings"
                  ? "border-primary-green text-primary-green"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              My Listings
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === "requests"
                  ? "border-primary-green text-primary-green"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Tenant Requests
              {pendingRequests > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {pendingRequests}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("earnings")}
              className={`px-6 py-4 text-sm font-medium border-b-2 flex items-center gap-1.5 ${
                activeTab === "earnings"
                  ? "border-primary-green text-primary-green"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Earnings
            </button>
          </nav>
        </div>

        <div className="p-6">
          {isLoading && activeTab !== "earnings" ? (
            <div className="text-center py-8 text-gray-500">Loading dashboard...</div>
          ) : activeTab === "listings" ? (
            listings.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No listings yet. Add your first property.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Requests</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing) => (
                      <tr key={listing.id} className="border-b border-gray-100">
                        <td className="py-4 px-4 font-medium text-navy">{listing.title}</td>
                        <td className="py-4 px-4 text-gray-600">{listing.location.name}</td>
                        <td className="py-4 px-4 text-primary-green font-medium">{formatPrice(listing.price)}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              listing.status === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : listing.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {listing.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{listing._count?.bookings ?? 0}</td>
                        <td className="py-4 px-4 flex gap-3">
                          <Link
                            href={`/landlord/properties/${listing.id}`}
                            className="text-sm text-[#192F59] hover:text-[#E67E22] font-medium transition-colors"
                          >
                            View
                          </Link>
                          <Link
                            href={`/landlord/edit-property/${listing.id}`}
                            className="text-sm text-gray-500 hover:text-[#E67E22] font-medium transition-colors"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === "requests" ? (
            requests.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No tenant requests yet.</div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                  >
                    <div className="min-w-0">
                      <h3 className="font-semibold text-navy truncate">{request.student.name}</h3>
                      <p className="text-gray-600 text-sm truncate">Property: {request.property.title}</p>
                      <p className="text-gray-700 text-sm mt-1">
                        Bid: <span className="font-semibold text-[#00A553]">{formatPrice(bidAmountValue(request))}</span>
                        <span className="text-gray-400 text-xs ml-2">(listed: {formatPrice(request.property.price)})</span>
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Submitted {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      {request.status === "AWAITING_PAYMENT" && (
                        <p className="text-xs text-orange-600 mt-1 font-medium">⏳ Student has 48 hours to complete payment</p>
                      )}
                      {request.status === "PENDING" && (highestBidByProperty[request.property.id]?.total ?? 0) >= 2 && (
                        <p className="text-xs text-orange-700 mt-1">
                          Multiple bids — only highest bid can be accepted.
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {/* Legacy PENDING bookings: keep Accept/Decline */}
                      {request.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateRequestStatus(request.id, "CONFIRMED")}
                            disabled={updatingRequestId === request.id || !canAcceptRequest(request)}
                            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md text-sm"
                            title={!canAcceptRequest(request) ? "Only highest bid can be accepted when there are multiple requests." : undefined}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => updateRequestStatus(request.id, "CANCELLED")}
                            disabled={updatingRequestId === request.id}
                            className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-sm"
                          >
                            Decline
                          </button>
                        </div>
                      ) : request.status === "AWAITING_PAYMENT" ? (
                        /* New flow: student is about to pay — landlord can only cancel */
                        <button
                          onClick={() => updateRequestStatus(request.id, "CANCELLED")}
                          disabled={updatingRequestId === request.id}
                          className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-md text-sm"
                        >
                          {updatingRequestId === request.id ? "Cancelling…" : "Cancel Booking"}
                        </button>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge(request.status)}`}>
                          {request.status.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === "earnings" ? (
            earningsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading earnings...</div>
            ) : !earnings ? (
              <div className="text-center py-10 text-gray-500">No earnings data available.</div>
            ) : (
              <div>
                {/* Earnings summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                    <p className="text-sm font-medium text-green-700 mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold text-green-800">{formatPrice(earnings.totalEarnings)}</p>
                    <p className="text-xs text-green-600 mt-1">All time</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <p className="text-sm font-medium text-blue-700 mb-1">This Month</p>
                    <p className="text-3xl font-bold text-blue-800">{formatPrice(earnings.monthlyEarnings)}</p>
                    <p className="text-xs text-blue-600 mt-1">Current month</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <p className="text-sm font-medium text-gray-600 mb-1">Paid Bookings</p>
                    <p className="text-3xl font-bold text-navy">{earnings.totalPaidBookings}</p>
                    <p className="text-xs text-gray-400 mt-1">Completed payments</p>
                  </div>
                </div>

                {/* Earnings table */}
                {earnings.bookings.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">No paid bookings yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Paid On</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Move-in</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Ref</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnings.bookings.map((b) => (
                          <tr key={b.id} className="border-b border-gray-100">
                            <td className="py-4 px-4 font-medium text-navy">{b.propertyTitle}</td>
                            <td className="py-4 px-4 text-gray-600">{b.studentName}</td>
                            <td className="py-4 px-4 text-green-700 font-semibold">{formatPrice(b.amount)}</td>
                            <td className="py-4 px-4 text-gray-600">{b.paidAt ? new Date(b.paidAt).toLocaleDateString() : "—"}</td>
                            <td className="py-4 px-4 text-gray-600">{b.moveInDate ? new Date(b.moveInDate).toLocaleDateString() : "—"}</td>
                            <td className="py-4 px-4 text-xs text-gray-400 font-mono">{b.paystackRef ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
