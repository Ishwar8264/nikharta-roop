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

const CATEGORIES = [
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

/** Seeds the global service categories used by every salon. */
async function seedServiceCategories(): Promise<void> {
  for (const category of CATEGORIES) {
    await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, icon: category.icon },
      create: category,
    });
  }
}

seedServiceCategories()
  .then(() => {
    console.log(`Seeded ${CATEGORIES.length} service categories`);
  })
  .catch((error: unknown) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
