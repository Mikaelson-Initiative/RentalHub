/**
 * types/index.ts
 *
 * Shared TypeScript types for RentalHub Nigeria (frontend).
 *
 * NOTE: The backend (database + API) lives in a separate repository.
 * These types were previously derived from the Prisma schema; they are
 * now defined standalone so the frontend builds without a database layer.
 * Dates/decimals are represented as the JSON shapes returned by the API.
 */

// ── Enums (string-literal unions) ─────────────────────────
export type Role = 'STUDENT' | 'LANDLORD' | 'ADMIN';
export type VerificationStatus =
  | 'UNVERIFIED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';
export type PropertyStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'CANCELLED'
  | 'EXPIRED';
export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIAL_REFUND';
export type PayoutStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';
export type NotificationType =
  | 'SYSTEM'
  | 'ACCOUNT'
  | 'VERIFICATION'
  | 'PROPERTY'
  | 'BOOKING'
  | 'PAYMENT';

// ── Core models (formerly Prisma models) ──────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string | null;
  role: Role;
  verificationStatus: VerificationStatus;
  emailVerified: boolean;
  emailVerificationSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  phoneNumber?: string | null;
  phoneVerified: boolean;
  governmentIdUrl?: string | null;
  selfieUrl?: string | null;
  isDirectOwner?: boolean | null;
  landlordAware?: boolean | null;
  ownershipProofUrl?: string | null;
  verificationNote?: string | null;
  verificationSubmittedAt?: string | null;
  avatarUrl?: string | null;
  aiPreScreenScore?: string | null;
  aiPreScreenNote?: string | null;
  bankAccountNumber?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  paystackRecipientCode?: string | null;
  bankChangeAt?: string | null;
}

export interface Location {
  id: string;
  name: string;
  classification: string;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  distanceToCampus?: number | null;
  amenities: string[];
  images: string[];
  status: PropertyStatus;
  vacantUnits: number;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  aiScamFlag: boolean;
  aiScamReason?: string | null;
  createdAt: string;
  updatedAt: string;
  landlordId: string;
  locationId: string;
  reviewedById?: string | null;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  bidAmount?: number | null;
  amount?: number | null;
  agencyFee?: number | null;
  cautionFee?: number | null;
  paymentStatus: PaymentStatus;
  paidAt?: string | null;
  expiresAt?: string | null;
  moveInDate?: string | null;
  leaseEndDate?: string | null;
  movedInConfirmedAt?: string | null;
  payoutStatus: PayoutStatus;
  agreementSignedAt?: string | null;
  agreementSignedName?: string | null;
  studentId: string;
  propertyId: string;
}

// ── Safe User type (no password) ──────────────────────────
export type SafeUser = Omit<User, 'password'>;

// ── Property with relations ───────────────────────────────
export type PropertyWithRelations = Property & {
  landlord: SafeUser;
  location: Location;
  _count?: {
    bookings: number;
  };
};

// ── Booking with relations ────────────────────────────────
export type BookingWithRelations = Booking & {
  student: SafeUser;
  property: Property & {
    location: Location;
    landlord: SafeUser;
  };
};

// ── API Response shapes ───────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Search / filter params ────────────────────────────────
export interface PropertySearchParams {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  status?: PropertyStatus;
  page?: number;
  pageSize?: number;
  sortBy?: 'price' | 'createdAt' | 'distanceToCampus';
  sortOrder?: 'asc' | 'desc';
}

// ── Auth session user ────────────────────────────────────
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  verificationStatus: VerificationStatus;
}

// ── Form data types ──────────────────────────────────────
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface PropertyFormData {
  title: string;
  description: string;
  price: number;
  locationId: string;
  distanceToCampus?: number;
  amenities: string[];
  images: string[];
}

export interface BookingFormData {
  propertyId: string;
}
