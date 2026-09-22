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

Promise.all([seedServiceCategories(), seedProductCategories()])
  .then(() => {
    console.log(
      `Seeded ${SERVICE_CATEGORIES.length} service categories and ${PRODUCT_CATEGORIES.length} product categories`,
    );
  })
  .catch((error: unknown) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
