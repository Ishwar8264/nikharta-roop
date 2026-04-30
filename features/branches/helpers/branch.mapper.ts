type BranchRow = {
  address: string;
  city: string;
  closeTime: Date;
  createdAt: Date;
  googleMapsUrl: string | null;
  id: string;
  isActive: boolean;
  latitude: DecimalLike | null;
  longitude: DecimalLike | null;
  nameEn: string | null;
  nameHi: string;
  openTime: Date;
  phone: string;
  placeId: string | null;
  updatedAt: Date;
};

type DecimalLike = {
  toString(): string;
};

/**
 * Converts a Branch row into the public discovery API shape.
 */
export function toPublicBranch(branch: BranchRow) {
  return {
    address: branch.address,
    city: branch.city,
    closeTime: toTimeString(branch.closeTime),
    createdAt: branch.createdAt,
    googleMapsUrl: branch.googleMapsUrl,
    id: branch.id,
    isActive: branch.isActive,
    latitude: branch.latitude?.toString() ?? null,
    longitude: branch.longitude?.toString() ?? null,
    nameEn: branch.nameEn,
    nameHi: branch.nameHi,
    openTime: toTimeString(branch.openTime),
    phone: branch.phone,
    placeId: branch.placeId,
    updatedAt: branch.updatedAt,
  };
}

/**
 * Formats Prisma @db.Time values as HH:mm:ss for API consumers.
 */
function toTimeString(value: Date) {
  return value.toISOString().slice(11, 19);
}
