import type { SalonCategory } from "@/generated/prisma/client";

import type { FilterChipOption } from "@/components/shared";
import { Baby, User, UserCircle, Users } from "lucide-react";

/**
 * Category options for salon filters.
 *
 * Why not in types.ts:
 * `types.ts` must stay pure TypeScript — no runtime imports. A constant is
 * runtime data, and keeping it in the same file would force every consumer
 * of the type to also pull the constant into their bundle.
 *
 * Why FilterChipOption type:
 * Ties the options to the shape FilterChips expects. A field rename in
 * that component surfaces here as a compile error instead of a silent
 * "chip renders with blank label" bug.
 */
export const SALON_CATEGORY_OPTIONS: FilterChipOption<SalonCategory>[] = [
  { value: "UNISEX", label: "Unisex", icon: Users },
  { value: "MALE", label: "Men", icon: User },
  { value: "FEMALE", label: "Women", icon: UserCircle },
  { value: "KIDS", label: "Kids", icon: Baby },
];
