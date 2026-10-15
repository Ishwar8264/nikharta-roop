import { StaffFormSkeleton } from "@/features/staff/staff-form-skeleton";

export default function StaffFormLoading() {
  return <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8" role="status" aria-label="Loading staff form" aria-busy="true"><StaffFormSkeleton /></div>;
}
