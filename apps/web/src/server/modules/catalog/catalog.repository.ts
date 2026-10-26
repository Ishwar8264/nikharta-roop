import "server-only";

import { prisma } from "@/lib/prisma";

/** Public projection of a platform catalog template. */
const PUBLIC_TEMPLATE_SELECT = {
  id: true,
  key: true,
  kind: true,
  categoryId: true,
  name: true,
  description: true,
  icon: true,
  sortOrder: true,
} as const;

/** Public projection of a salon's activated template (price + template). */
const PUBLIC_SALON_TEMPLATE_SELECT = {
  id: true,
  templateId: true,
  price: true,
  isActive: true,
  template: { select: PUBLIC_TEMPLATE_SELECT },
} as const;

/** Lists active platform templates, optionally filtered by kind. */
export async function listActiveCatalogTemplates(kind?: string) {
  return prisma.catalogTemplate.findMany({
    where: { isActive: true, ...(kind ? { kind } : {}) },
    select: PUBLIC_TEMPLATE_SELECT,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

/** Loads a template by its stable key. */
export async function findTemplateByKey(key: string) {
  return prisma.catalogTemplate.findUnique({
    where: { key },
    select: { ...PUBLIC_TEMPLATE_SELECT, isActive: true },
  });
}

/** Lists a salon's activated templates (public surface). */
export async function listSalonTemplates(salonId: string) {
  return prisma.salonTemplate.findMany({
    where: { salonId },
    select: PUBLIC_SALON_TEMPLATE_SELECT,
  });
}

/** Loads one activated template row for a salon by template id. */
export async function findSalonTemplate(salonId: string, templateId: string) {
  return prisma.salonTemplate.findUnique({
    where: { salonId_templateId: { salonId, templateId } },
    select: PUBLIC_SALON_TEMPLATE_SELECT,
  });
}

/** Creates or updates a salon's activation with the given price. */
export async function upsertSalonTemplate(
  salonId: string,
  templateId: string,
  price: number,
) {
  return prisma.salonTemplate.upsert({
    where: { salonId_templateId: { salonId, templateId } },
    update: { price, isActive: true },
    create: { salonId, templateId, price },
    select: PUBLIC_SALON_TEMPLATE_SELECT,
  });
}

/** Applies a partial update to an activation row. */
export async function updateSalonTemplateById(
  id: string,
  data: { price?: number; isActive?: boolean },
) {
  return prisma.salonTemplate.update({
    where: { id },
    data,
    select: PUBLIC_SALON_TEMPLATE_SELECT,
  });
}

/** Removes a salon's activation entirely. */
export async function deleteSalonTemplateById(id: string): Promise<void> {
  await prisma.salonTemplate.delete({ where: { id } });
}
