import { getDb } from "@/db";
import {
  CONSULTATION_CODES,
  CONSULTATION_MESSAGES,
} from "@/features/consultations/constants/consultation.constants";
import { toDateOnly } from "@/features/consultations/helpers/consultation.data";
import { toPublicConsultation } from "@/features/consultations/helpers/consultation.mapper";
import { consultationSelect } from "@/features/consultations/helpers/consultation.selectors";
import {
  consultationError,
  consultationJson,
} from "@/features/consultations/responses/consultation.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  adminListConsultationsQuerySchema,
  type AdminListConsultationsQueryInput,
} from "@/schema/consultations/schema.consultation";
import { handleConsultationError, validationError } from "./consultation.errors";
import { requireConsultationAdmin } from "./consultation.shared";

/**
 * Handles admin consultation listing.
 */
export async function handleListAdminConsultations(request: Request) {
  const auth = await requireConsultationAdmin(request);
  if (!auth.success) return auth.error;
  const query = adminListConsultationsQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!query.success) return validationError(query.error.issues[0]?.message);
  const branchId = resolveBranchId(query.data.branchId, auth.session.user);
  if (!branchId.ok) return branchId.error;
  return listAdminConsultations({
    ...query.data,
    branchId: branchId.value,
    limit: query.data.limit ?? 50,
  });
}

async function listAdminConsultations(input: {
  branchId?: string;
} & AdminListConsultationsQueryInput) {
  try {
    const consultations = await getDb().consultation.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: consultationSelect(),
      take: input.limit,
      where: {
        branchId: input.branchId,
        preferredDate: toDateOnly(input.date),
        status: input.status,
      },
    });
    return consultationJson({
      code: CONSULTATION_CODES.CONSULTATIONS_LISTED,
      data: {
        consultations: consultations.map(toPublicConsultation),
        limit: input.limit,
      },
      message: CONSULTATION_MESSAGES.CONSULTATIONS_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleConsultationError(error, {
      code: CONSULTATION_CODES.CONSULTATIONS_LOAD_FAILED,
      handler: "listAdminConsultations",
      message: CONSULTATION_MESSAGES.CONSULTATIONS_LOAD_FAILED,
    });
  }
}

function resolveBranchId(branchId: string | undefined, admin: {
  branchId?: string | null;
  role: string;
}) {
  if (admin.role === "SUPER_ADMIN") return { ok: true as const, value: branchId };
  if (admin.branchId && (!branchId || branchId === admin.branchId)) {
    return { ok: true as const, value: admin.branchId };
  }
  return {
    error: consultationError({
      code: CONSULTATION_CODES.FORBIDDEN,
      message: CONSULTATION_MESSAGES.FORBIDDEN,
      status: HTTP_STATUS.FORBIDDEN,
    }),
    ok: false as const,
  };
}
