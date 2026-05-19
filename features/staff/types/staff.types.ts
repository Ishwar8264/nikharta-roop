/**
 * Purpose: Shared TypeScript types for staff management screens.
 * Responsibilities: align component and query contracts with staff mapper response shapes.
 * Important notes: Date fields may be serialized by API responses before reaching UI code.
 */
import type { toPublicStaff } from "@/features/staff/helpers/staff.mapper";

export type PublicStaff = ReturnType<typeof toPublicStaff>;

export type StaffListResult = {
  error: string | null;
  staff: PublicStaff[];
};

export type StaffServiceOption = {
  branchId: string;
  id: string;
  nameHi: string;
};

export type StaffUserOption = {
  branchId: null | string;
  id: string;
  label: string;
};
