export interface ServiceCategoryOption {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface CreatedService {
  id: string;
  salonId: string;
  name: string;
  slug: string;
}

export interface CreateServiceResponse {
  message: string;
  data: { service: CreatedService };
}

export interface ApiFieldError {
  field: string;
  message: string;
}
