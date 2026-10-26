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
  { name: "Skin", slug: "skin", icon: "sparkles" },
  { name: "Beard & Grooming", slug: "beard-grooming", icon: "razor" },
  { name: "Spa & Massage", slug: "spa-massage", icon: "flower" },
  { name: "Hair Removal", slug: "hair-removal", icon: "leaf" },
  { name: "Bridal & Pre-Bridal", slug: "bridal-pre-bridal", icon: "crown" },
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
  { name: "Styling Tools", slug: "styling-tools" },
  { name: "Color & Developer", slug: "color-developer" },
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
  { key: "svc.haircut.men", kind: "SERVICE", category: "hair", name: "Men's Haircut", description: "A haircut tailored to your preferred style.", icon: "scissors", sortOrder: 10 },
  { key: "svc.haircut.women", kind: "SERVICE", category: "hair", name: "Women's Haircut", description: "A haircut shaped to suit your preferred look.", icon: "scissors", sortOrder: 20 },
  { key: "svc.facial.gold", kind: "SERVICE", category: "skin", name: "Gold Facial", description: "A gold facial for skin care and a refreshed look.", icon: "sparkles", sortOrder: 30 },
  { key: "svc.facial.detan", kind: "SERVICE", category: "skin", name: "De-Tan Facial", description: "A facial focused on reducing the appearance of tan.", icon: "sparkles", sortOrder: 40 },
  { key: "svc.haircolor.global", kind: "SERVICE", category: "hair", name: "Global Hair Color", description: "All-over hair coloring for a consistent shade.", icon: "palette", sortOrder: 50 },
  { key: "svc.hair.keratin", kind: "SERVICE", category: "hair", name: "Keratin Treatment", description: "A keratin treatment for smoother, more manageable hair.", icon: "scissors", sortOrder: 60 },
  { key: "svc.hair.smoothening", kind: "SERVICE", category: "hair", name: "Hair Smoothening", description: "A hair treatment focused on a smoother finish.", icon: "scissors", sortOrder: 70 },
  { key: "svc.hair.botox", kind: "SERVICE", category: "hair", name: "Hair Botox", description: "A conditioning hair treatment for a smoother look.", icon: "scissors", sortOrder: 80 },
  { key: "svc.beard.trim", kind: "SERVICE", category: "beard-grooming", name: "Beard Trim", description: "Beard trimming and shaping for a neat finish.", icon: "razor", sortOrder: 90 },
  { key: "svc.nails.manicure", kind: "SERVICE", category: "nails", name: "Manicure", description: "Hand and nail grooming for a polished finish.", icon: "hand", sortOrder: 100 },
  { key: "svc.nails.pedicure", kind: "SERVICE", category: "nails", name: "Pedicure", description: "Foot and nail grooming for a polished finish.", icon: "hand", sortOrder: 110 },
  { key: "svc.makeup.bridal", kind: "SERVICE", category: "bridal-pre-bridal", name: "Bridal Makeup", description: "Makeup tailored to your bridal look.", icon: "crown", sortOrder: 120 },
  { key: "svc.makeup.party", kind: "SERVICE", category: "makeup", name: "Party Makeup", description: "Makeup tailored to your party or occasion.", icon: "brush", sortOrder: 130 },
  { key: "pkg.bridal.royal", kind: "PACKAGE", category: "bridal-pre-bridal", name: "Royal Bridal Package", description: "A bridal care package for wedding preparation.", icon: "crown", sortOrder: 140 },
  { key: "pkg.party.combo", kind: "PACKAGE", category: "makeup", name: "Party Combo", description: "A package for your party-ready look.", icon: "brush", sortOrder: 150 },
  { key: "pkg.hair.monthly", kind: "PACKAGE", category: "hair", name: "Monthly Hair Package", description: "A package for regular monthly hair care.", icon: "scissors", sortOrder: 160 },
  // Preserve the existing catalog entries outside the requested selection.
  { key: "svc.spa.swedish", kind: "SERVICE", category: "massage-spa", name: "Swedish Massage", icon: "flower", sortOrder: 6 },
  { key: "svc.wax.fullarms", kind: "SERVICE", category: "waxing", name: "Full Arms Wax", icon: "leaf", sortOrder: 9 },
  { key: "svc.thread.eyebrow", kind: "SERVICE", category: "threading", name: "Eyebrow Threading", icon: "thread", sortOrder: 10 },
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

    if (!categoryId) {
      throw new Error(
        `Missing service category "${template.category}" for template "${template.key}"`,
      );
    }

    await prisma.catalogTemplate.upsert({
      where: { key: template.key },
      update: {
        kind: template.kind,
        categoryId,
        name: template.name,
        ...("description" in template ? { description: template.description } : {}),
        icon: template.icon,
        sortOrder: template.sortOrder,
      },
      create: {
        key: template.key,
        kind: template.kind,
        categoryId,
        name: template.name,
        ...("description" in template ? { description: template.description } : {}),
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
