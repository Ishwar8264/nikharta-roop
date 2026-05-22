/**
 * Purpose: Shared TypeScript types for portfolio admin and public gallery screens.
 * Responsibilities: keep query and component contracts aligned with portfolio mapper response shapes.
 * Important notes: imageUrls can contain multiple gallery images while before/after URLs are optional.
 */
import type { toPublicPortfolioItem } from "@/features/portfolio/helpers/portfolio.mapper";

export type PublicPortfolioItem = ReturnType<typeof toPublicPortfolioItem>;

export type PortfolioListResult = {
  error: string | null;
  items: PublicPortfolioItem[];
};

export type PortfolioRelationOption = {
  branchId: string;
  id: string;
  label: string;
};
