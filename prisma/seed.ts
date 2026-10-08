import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const SERVICE_CATEGORIES = [
  { name: "Hair", slug: "hair", icon: "scissors" },
  { name: "Hair Color", slug: "hair-color", icon: "palette" },
  { name: "Beard & Shave", slug: "beard-shave", icon: "razor" },
  { name: "Facial & Skin", slug: "facial-skin", icon: "sparkles" },
  { name: "Massage & Spa", slug: "massage-spa", icon: "flower" },
  { name: "Nails", slug: "nails", icon: "hand" },
  { name: "Makeup", slug: "makeup", icon: "brush" },
  { name: "Waxing", slug: "waxing", icon: "leaf" },
  { name: "Threading", slug: "threading", icon: "thread" },
  { name: "Bridal & Wedding", slug: "bridal-wedding", icon: "crown" },
  { name: "Kids", slug: "kids", icon: "baby" },
  { name: "Men's Grooming", slug: "mens-grooming", icon: "mustache" },
] as const;

const PRODUCT_CATEGORIES = [
  { name: "Hair Care", slug: "hair-care" },
  { name: "Skin Care", slug: "skin-care" },
  { name: "Beard Care", slug: "beard-care" },
  { name: "Nail Care", slug: "nail-care" },
  { name: "Makeup", slug: "makeup-products" },
  { name: "Tools & Accessories", slug: "tools-accessories" },
  { name: "Fragrances", slug: "fragrances" },
  { name: "Body Care", slug: "body-care" },
  { name: "Spa & Wellness", slug: "spa-wellness" },
  { name: "Gift Sets", slug: "gift-sets" },
] as const;

/**
 * Platform catalog — standard Indian salon services + packages.
 * Salon owners activate these via SalonTemplate with their own price,
 * so a new launch = a new row here, never a code change.
 */
const CATALOG_TEMPLATES = [
  { key: "svc.haircut.men", kind: "SERVICE", category: "hair", name: "Haircut (Men)", icon: "scissors", sortOrder: 1 },
  { key: "svc.haircut.women", kind: "SERVICE", category: "hair", name: "Haircut (Women)", icon: "scissors", sortOrder: 2 },
  { key: "svc.haircolor.global", kind: "SERVICE", category: "hair-color", name: "Global Hair Color", icon: "palette", sortOrder: 3 },
  { key: "svc.beard.trim", kind: "SERVICE", category: "beard-shave", name: "Beard Trim & Style", icon: "razor", sortOrder: 4 },
  { key: "svc.facial.gold", kind: "SERVICE", category: "facial-skin", name: "Gold Facial", icon: "sparkles", sortOrder: 5 },
  { key: "svc.spa.swedish", kind: "SERVICE", category: "massage-spa", name: "Swedish Massage", icon: "flower", sortOrder: 6 },
  { key: "svc.nails.manicure", kind: "SERVICE", category: "nails", name: "Manicure", icon: "hand", sortOrder: 7 },
  { key: "svc.makeup.party", kind: "SERVICE", category: "makeup", name: "Party Makeup", icon: "brush", sortOrder: 8 },
  { key: "svc.wax.fullarms", kind: "SERVICE", category: "waxing", name: "Full Arms Wax", icon: "leaf", sortOrder: 9 },
  { key: "svc.thread.eyebrow", kind: "SERVICE", category: "threading", name: "Eyebrow Threading", icon: "thread", sortOrder: 10 },
  { key: "pkg.bridal.royal", kind: "PACKAGE", category: "bridal-wedding", name: "Bridal Royal Package", icon: "crown", sortOrder: 11 },
  { key: "pkg.groom.royal", kind: "PACKAGE", category: "mens-grooming", name: "Groom Royal Package", icon: "mustache", sortOrder: 12 },
  { key: "pkg.glow.combo", kind: "PACKAGE", category: "facial-skin", name: "Glow Combo (Facial + Cleanup)", icon: "sparkles", sortOrder: 13 },
] as const;

/** Seeds the global service categories used by every salon. */
async function seedServiceCategories(): Promise<void> {
  for (const category of SERVICE_CATEGORIES) {
    await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, icon: category.icon },
      create: category,
    });
  }
}

/** Seeds the global product categories used by every salon. */
async function seedProductCategories(): Promise<void> {
  for (const category of PRODUCT_CATEGORIES) {
    await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }
}

/** Seeds the platform catalog templates salons activate at onboarding. */
async function seedCatalogTemplates(): Promise<void> {
  const categories = await prisma.serviceCategory.findMany({
    select: { id: true, slug: true },
  });
  const categoryIdBySlug = new Map(
    categories.map((category) => [category.slug, category.id]),
  );

  for (const template of CATALOG_TEMPLATES) {
    const categoryId = categoryIdBySlug.get(template.category);

    await prisma.catalogTemplate.upsert({
      where: { key: template.key },
      update: {
        kind: template.kind,
        categoryId: categoryId ?? null,
        name: template.name,
        icon: template.icon,
        sortOrder: template.sortOrder,
      },
      create: {
        key: template.key,
        kind: template.kind,
        categoryId: categoryId ?? null,
        name: template.name,
        icon: template.icon,
        sortOrder: template.sortOrder,
      },
    });
  }
}

Promise.all([
  seedServiceCategories().then(seedCatalogTemplates),
  seedProductCategories(),
])
  .then(() => {
    console.log(
      `Seeded ${SERVICE_CATEGORIES.length} service categories, ${PRODUCT_CATEGORIES.length} product categories, and ${CATALOG_TEMPLATES.length} catalog templates`,
    );
  })
  .catch((error: unknown) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
