type ProfileUserRow = {
  avatarUrl: string | null;
  branchId: string | null;
  email: string | null;
  id: string;
  mobile: string;
  mobileVerifiedAt: Date | null;
  name: string | null;
  notificationPreferences: unknown;
  profileCompletedAt: Date | null;
  role: string;
};

type AddressRow = {
  branchId: string | null;
  city: string;
  createdAt: Date;
  id: string;
  isDefault: boolean;
  label: string | null;
  landmark: string | null;
  latitude: DecimalLike | null;
  line1: string;
  line2: string | null;
  longitude: DecimalLike | null;
  mobile: string | null;
  postalCode: string | null;
  recipientName: string | null;
  state: string | null;
  updatedAt: Date;
};

type DecimalLike = {
  toString(): string;
};

type BookingRow = {
  bookingDate: Date;
  branch: {
    city: string;
    id: string;
    nameEn: string | null;
    nameHi: string;
  };
  createdAt: Date;
  displayId: string;
  id: string;
  package: {
    id: string;
    nameEn: string | null;
    nameHi: string;
  } | null;
  service: {
    id: string;
    nameEn: string;
    nameHi: string;
  } | null;
  serviceVariant: {
    id: string;
    nameEn: string | null;
    nameHi: string;
  } | null;
  slotEnd: Date;
  slotStart: Date;
  staff: {
    id: string;
    user: {
      name: string | null;
    };
  } | null;
  status: string;
  totalAmount: DecimalLike;
  updatedAt: Date;
};

/**
 * Converts a DB user row into the public profile API shape.
 */
export function toProfileUser(user: ProfileUserRow) {
  return {
    avatarUrl: user.avatarUrl,
    branchId: user.branchId,
    email: user.email,
    id: user.id,
    mobile: user.mobile,
    mobileVerifiedAt: user.mobileVerifiedAt,
    name: user.name,
    notificationPreferences: user.notificationPreferences,
    profileCompletedAt: user.profileCompletedAt,
    role: user.role,
  };
}

/**
 * Converts a customer address row into an API-safe shape.
 */
export function toCustomerAddress(address: AddressRow) {
  return {
    branchId: address.branchId,
    city: address.city,
    createdAt: address.createdAt,
    id: address.id,
    isDefault: address.isDefault,
    label: address.label,
    landmark: address.landmark,
    latitude: address.latitude?.toString() ?? null,
    line1: address.line1,
    line2: address.line2,
    longitude: address.longitude?.toString() ?? null,
    mobile: address.mobile,
    postalCode: address.postalCode,
    recipientName: address.recipientName,
    state: address.state,
    updatedAt: address.updatedAt,
  };
}

/**
 * Converts a booking row into the compact user booking history shape.
 */
export function toUserBooking(booking: BookingRow) {
  return {
    bookingDate: booking.bookingDate,
    branch: booking.branch,
    createdAt: booking.createdAt,
    displayId: booking.displayId,
    id: booking.id,
    package: booking.package,
    service: booking.service,
    serviceVariant: booking.serviceVariant,
    slotEnd: booking.slotEnd,
    slotStart: booking.slotStart,
    staff: booking.staff
      ? {
          id: booking.staff.id,
          name: booking.staff.user.name,
        }
      : null,
    status: booking.status,
    totalAmount: booking.totalAmount.toString(),
    updatedAt: booking.updatedAt,
  };
}
