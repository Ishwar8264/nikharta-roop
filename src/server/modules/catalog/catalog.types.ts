import type { z } from "zod";

import type {
  activateTemplateSchema,
  listTemplatesQuerySchema,
  updateSalonTemplateSchema,
} from "./catalog.schema";

export type ListTemplatesQuery = z.infer<typeof listTemplatesQuerySchema>;
export type ActivateTemplateInput = z.infer<typeof activateTemplateSchema>;
export type UpdateSalonTemplateInput = z.infer<
  typeof updateSalonTemplateSchema
>;

/** Template row returned to public clients. */
export interface PublicCatalogTemplate {
  id: string;
  key: string;
  kind: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
}

/** A salon's activation of a template, with the template embedded. */
export interface PublicSalonTemplate {
  id: string;
  templateId: string;
  price: number;
  isActive: boolean;
  template: PublicCatalogTemplate;
}
