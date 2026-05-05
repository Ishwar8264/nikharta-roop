import {
  handleGetAdminConsultation,
  handleUpdateAdminConsultation,
} from "@/features/consultations/handlers/consultation.handlers";

export const runtime = "nodejs";

type AdminConsultationRouteContext = {
  params: Promise<{ consultationId: string }>;
};

export async function GET(
  request: Request,
  context: AdminConsultationRouteContext,
) {
  const { consultationId } = await context.params;
  return handleGetAdminConsultation(request, consultationId);
}

export async function PATCH(
  request: Request,
  context: AdminConsultationRouteContext,
) {
  const { consultationId } = await context.params;
  return handleUpdateAdminConsultation(request, consultationId);
}
