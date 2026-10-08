import "server-only";

import { assertRoleAtLeast } from "@/server/modules/salon/salon.authorization";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { findSalonForViewer } from "@/server/modules/salon/salon.repository";
import { resolveSalonId } from "@/server/modules/service/service.repository";

import {
  CatalogTemplateInactiveError,
  CatalogTemplateNotFoundError,
} from "./catalog.errors";
import type {
  ActivateTemplateInput,
  ListTemplatesQuery,
  PublicCatalogTemplate,
  PublicSalonTemplate,
  UpdateSalonTemplateInput,
} from "./catalog.types";
import {
  deleteSalonTemplateById,
  findSalonTemplate,
  findTemplateByKey,
  listActiveCatalogTemplates,
  listSalonTemplates as listSalonTemplateRows,
  updateSalonTemplateById,
  upsertSalonTemplate,
} from "./catalog.repository";

/** Normalizes Prisma Decimal prices to plain numbers at the API boundary. */
function toPublicSalonTemplate(row: {
  id: string;
  templateId: string;
  price: { toNumber(): number } | number;
  isActive: boolean;
  template: {
    id: string;
    key: string;
    kind: string;
    categoryId: string | null;
    name: string;
    description: string | null;
    icon: string | null;
    sortOrder: number;
  };
}): PublicSalonTemplate {
  return {
    id: row.id,
    templateId: row.templateId,
    price: Number(row.price),
    isActive: row.isActive,
    template: row.template,
  };
}

/** Lists the platform catalog. Public — salons browse what they can activate. */
export async function listCatalogTemplates(
  query: ListTemplatesQuery,
): Promise<PublicCatalogTemplate[]> {
  return listActiveCatalogTemplates(query.kind);
}

/** Lists a salon's activated templates. Public. */
export async function listSalonActivatedTemplates(
  salonRef: string,
): Promise<PublicSalonTemplate[]> {
  const salonId = await resolveSalonId(salonRef, true);
  if (!salonId) throw new SalonNotFoundError();

  const rows = await listSalonTemplateRows(salonId);
  return rows
    .filter((row) => row.isActive)
    .map(toPublicSalonTemplate);
}

/** Loads a salon for a management operation and asserts MANAGER+. */
async function loadManagedSalon(callerId: string, salonRef: string) {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const salon = await findSalonForViewer({ salonId, userId: callerId });
  if (!salon) throw new SalonNotFoundError();

  assertRoleAtLeast(salon.viewerRole, "MANAGER");
  return salonId;
}

/**
 * Activates a catalog template for the salon with the salon's own price.
 *
 * Why:
 * Upsert semantics keep the route idempotent — re-activating with a new
 * price simply updates the row instead of failing on a duplicate.
 */
export async function activateSalonTemplate(
  callerId: string,
  salonRef: string,
  input: ActivateTemplateInput,
): Promise<PublicSalonTemplate> {
  const salonId = await loadManagedSalon(callerId, salonRef);

  const template = await findTemplateByKey(input.templateKey);
  if (!template) throw new CatalogTemplateNotFoundError();
  if (!template.isActive) throw new CatalogTemplateInactiveError();

  return toPublicSalonTemplate(
    await upsertSalonTemplate(salonId, template.id, input.price),
  );
}

/** Updates a salon's activation (price or on/off). */
export async function updateSalonActivation(
  callerId: string,
  salonRef: string,
  templateKey: string,
  input: UpdateSalonTemplateInput,
): Promise<PublicSalonTemplate> {
  const salonId = await loadManagedSalon(callerId, salonRef);

  const template = await findTemplateByKey(templateKey);
  if (!template) throw new CatalogTemplateNotFoundError();

  const existing = await findSalonTemplate(salonId, template.id);
  if (!existing) throw new CatalogTemplateNotFoundError();

  return toPublicSalonTemplate(
    await updateSalonTemplateById(existing.id, {
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    }),
  );
}

/** Removes a salon's activation. */
export async function deactivateSalonTemplate(
  callerId: string,
  salonRef: string,
  templateKey: string,
): Promise<void> {
  const salonId = await loadManagedSalon(callerId, salonRef);

  const template = await findTemplateByKey(templateKey);
  if (!template) throw new CatalogTemplateNotFoundError();

  const existing = await findSalonTemplate(salonId, template.id);
  if (!existing) throw new CatalogTemplateNotFoundError();

  await deleteSalonTemplateById(existing.id);
}
