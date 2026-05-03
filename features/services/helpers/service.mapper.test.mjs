import assert from "node:assert/strict";
import test from "node:test";

import {
  toPublicService,
  toPublicServiceCategory,
  toPublicServiceDetail,
} from "./service.mapper.ts";

const now = new Date("2026-05-03T10:00:00.000Z");
const category = {
  branchId: null,
  createdAt: now,
  description: "Hair services",
  id: "category_1",
  isActive: true,
  nameEn: "Hair Services",
  nameHi: "बाल सेवाएं",
  slug: "hair-services",
  sortOrder: 10,
  updatedAt: now,
};

const service = {
  advanceAmount: { toString: () => "100.00" },
  branch: {
    city: "Jaipur",
    id: "branch_1",
    nameEn: "Nikharta Roop Jaipur",
    nameHi: "निखरता रूप जयपुर",
  },
  branchId: "branch_1",
  category,
  categoryId: "category_1",
  createdAt: now,
  descriptionEn: "Stylish hair cut.",
  descriptionHi: "स्टाइलिश हेयर कट।",
  durationMinutes: 45,
  galleryUrls: ["https://cdn.example.com/hair-cut-1.jpg"],
  id: "service_1",
  imageUrl: "https://cdn.example.com/hair-cut.jpg",
  isActive: true,
  nameEn: "Hair Cut",
  nameHi: "हेयर कट",
  price: { toString: () => "499.00" },
  slug: "hair-cut",
  updatedAt: now,
};

test("toPublicServiceCategory exposes category fields", () => {
  assert.deepEqual(toPublicServiceCategory(category), category);
});

test("toPublicService serializes decimal amounts", () => {
  const mapped = toPublicService(service);

  assert.equal(mapped.price, "499.00");
  assert.equal(mapped.advanceAmount, "100.00");
  assert.equal(mapped.category.slug, "hair-services");
});

test("toPublicServiceDetail includes variants and add-ons", () => {
  const mapped = toPublicServiceDetail({
    ...service,
    addOns: [
      {
        createdAt: now,
        descriptionHi: null,
        durationMinutes: 10,
        id: "addon_1",
        isActive: true,
        nameEn: "Hair Wash",
        nameHi: "हेयर वॉश",
        price: { toString: () => "149.00" },
        updatedAt: now,
      },
    ],
    variants: [
      {
        advanceAmount: null,
        createdAt: now,
        descriptionHi: null,
        durationMinutes: 60,
        id: "variant_1",
        isActive: true,
        nameEn: "Layer Cut",
        nameHi: "लेयर कट",
        price: { toString: () => "699.00" },
        sortOrder: 1,
        updatedAt: now,
      },
    ],
  });

  assert.equal(mapped.addOns[0].price, "149.00");
  assert.equal(mapped.variants[0].advanceAmount, null);
});
