import { getDb } from "@/db";
import {
  CONSULTATION_CODES,
  CONSULTATION_MESSAGES,
} from "@/features/consultations/constants/consultation.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  ConsultationVisibleError,
  type ConsultationAdminUser,
} from "./consultation.shared";

export function assertCanManageConsultationBranch(
  admin: ConsultationAdminUser,
  branchId: string,
) {
  if (admin.role === "SUPER_ADMIN" || admin.branchId === branchId) return;
  throw new ConsultationVisibleError(
    CONSULTATION_CODES.FORBIDDEN,
    CONSULTATION_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}

export async function assertConsultationRelations(input: {
  branchId: string;
  packageId?: string;
  staffId?: string;
}) {
  const branch = await getDb().branch.findFirst({
    select: { id: true },
    where: { id: input.branchId, isActive: true },
  });
  if (!branch) throwExpected("BRANCH_NOT_FOUND");

  if (input.packageId) {
    const pkg = await getDb().package.findFirst({
      select: { id: true },
      where: { branchId: input.branchId, id: input.packageId, isActive: true },
    });
    if (!pkg) throwExpected("PACKAGE_NOT_FOUND");
  }

  if (input.staffId) {
    const staff = await getDb().staff.findFirst({
      select: { id: true },
      where: { branchId: input.branchId, id: input.staffId, isAvailable: true },
    });
    if (!staff) throwExpected("STAFF_NOT_FOUND");
  }
}

function throwExpected(code: keyof typeof CONSULTATION_CODES) {
  throw new ConsultationVisibleError(
    CONSULTATION_CODES[code],
    CONSULTATION_MESSAGES[code],
    HTTP_STATUS.NOT_FOUND,
  );
}
