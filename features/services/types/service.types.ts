/**
 * Purpose: Shared TypeScript types for service catalog screens and API wiring.
 * Responsibilities: keep query/component contracts aligned with mapper response shapes.
 * Important notes: Date fields may arrive serialized from API responses, so UI code should not format them without normalization.
 */
import type {
  toPublicService,
  toPublicServiceCategory,
  toPublicServiceDetail,
} from "@/features/services/helpers/service.mapper";

export type PublicService = ReturnType<typeof toPublicService>;
export type PublicServiceCategory = ReturnType<typeof toPublicServiceCategory>;
export type PublicServiceDetail = ReturnType<typeof toPublicServiceDetail>;

export type ServiceListResult = {
  error: string | null;
  services: PublicServiceDetail[];
};

export type ServiceCategoryListResult = {
  categories: PublicServiceCategory[];
  error: string | null;
};
