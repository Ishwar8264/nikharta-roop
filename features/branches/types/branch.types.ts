export type PublicBranch = {
  address: string;
  city: string;
  closeTime: string;
  googleMapsUrl: string | null;
  id: string;
  isActive: boolean;
  latitude: string | null;
  longitude: string | null;
  nameEn: string | null;
  nameHi: string;
  openTime: string;
  phone: string;
  placeId?: string | null;
};

export type BranchListResult = {
  branches: PublicBranch[];
  error: string | null;
};
