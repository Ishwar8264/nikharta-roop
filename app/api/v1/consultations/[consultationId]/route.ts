import { handleGetMyConsultation } from "@/features/consultations/handlers/consultation.handlers";

export const runtime = "nodejs";

type ConsultationRouteContext = {
  params: Promise<{ consultationId: string }>;
};

export async function GET(
  request: Request,
  context: ConsultationRouteContext,
) {
  const { consultationId } = await context.params;
  return handleGetMyConsultation(request, consultationId);
}
