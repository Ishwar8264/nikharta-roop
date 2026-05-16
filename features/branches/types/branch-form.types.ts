export type BranchFormValues = {
  address: string;
  city: string;
  closeTime: string;
  googleMapsUrl: string;
  isActive: boolean;
  latitude: string;
  longitude: string;
  nameEn: string;
  nameHi: string;
  openTime: string;
  phone: string;
  placeId: string;
};

export type BranchFormErrors = Partial<Record<keyof BranchFormValues, string>>;
