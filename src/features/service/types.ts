export interface ServiceCategoryOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

/** Browser-safe shape returned by service create and update routes. */
export interface SalonService extends CreatedService {
  categoryId: string | null;
  category: ServiceCategoryOption | null;
  price: number;
  duration: number;
  isActive: boolean;
  shortDescription: string | null;
  description: string | null;
  descriptionHtml: string | null;
  descriptionJson: string | null;
  images: string[];
}

export interface CreatedService {
  id: string;
  salonId: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface CreateServiceResponse {
  message: string;
  data: { service: CreatedService };
}

export interface ApiFieldError {
  field: string;
  message: string;
}
