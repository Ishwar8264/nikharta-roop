type ConsultationRow = {
  adminNotes: string | null;
  branch?: { city: string; id: string; nameEn: string | null; nameHi: string };
  branchId: string;
  cancelledAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  id: string;
  notes: string | null;
  package?: {
    id: string;
    nameEn: string | null;
    nameHi: string;
    slug: string;
  } | null;
  packageId: string | null;
  preferredDate: Date | null;
  preferredTime: Date | null;
  staff?: { id: string; user: { name: string | null } } | null;
  staffId: string | null;
  status: string;
  updatedAt: Date;
  user?: { id: string; mobile: string; name: string | null };
  userId: string;
};

/**
 * Converts a consultation row into the public API shape.
 */
export function toPublicConsultation(consultation: ConsultationRow) {
  return {
    adminNotes: consultation.adminNotes,
    branch: consultation.branch ?? null,
    branchId: consultation.branchId,
    cancelledAt: consultation.cancelledAt,
    completedAt: consultation.completedAt,
    createdAt: consultation.createdAt,
    id: consultation.id,
    notes: consultation.notes,
    package: consultation.package,
    packageId: consultation.packageId,
    preferredDate: consultation.preferredDate,
    preferredTime: consultation.preferredTime,
    staff: consultation.staff
      ? { id: consultation.staff.id, name: consultation.staff.user.name }
      : null,
    staffId: consultation.staffId,
    status: consultation.status,
    updatedAt: consultation.updatedAt,
    user: consultation.user ?? null,
    userId: consultation.userId,
  };
}
