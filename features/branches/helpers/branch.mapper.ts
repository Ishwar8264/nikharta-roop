type BranchRow = {
  address: string;
  city: string;
  closeTime: Date;
  googleMapsUrl: string | null;
  id: string;
  nameEn: string | null;
  nameHi: string;
  openTime: Date;
  phone: string;
  updatedAt: Date;
};

/**
 * Converts a Branch row into the public discovery API shape.
 */
export function toPublicBranch(branch: BranchRow) {
  return {
    address: branch.address,
    city: branch.city,
    closeTime: toTimeString(branch.closeTime),
    googleMapsUrl: branch.googleMapsUrl,
    id: branch.id,
    nameEn: branch.nameEn,
    nameHi: branch.nameHi,
    openTime: toTimeString(branch.openTime),
    phone: branch.phone,
    updatedAt: branch.updatedAt,
  };
}

/**
 * Formats Prisma @db.Time values as HH:mm:ss for API consumers.
 */
function toTimeString(value: Date) {
  return value.toISOString().slice(11, 19);
}
