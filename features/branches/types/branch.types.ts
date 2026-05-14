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
};

export type BranchListResult = {
  branches: PublicBranch[];
  error: string | null;
};
