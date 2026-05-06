import {
  handleDeleteMedia,
  handleUpdateMedia,
} from "@/features/media/handlers/media.handlers";

export const runtime = "nodejs";

type AdminMediaRouteContext = {
  params: Promise<{ mediaId: string }>;
};

/**
 * Routes admin media patch requests to the media feature handler.
 */
export async function PATCH(request: Request, context: AdminMediaRouteContext) {
  const { mediaId } = await context.params;
  return handleUpdateMedia(request, mediaId);
}

/**
 * Routes admin media delete requests to the media feature handler.
 */
export async function DELETE(request: Request, context: AdminMediaRouteContext) {
  const { mediaId } = await context.params;
  return handleDeleteMedia(request, mediaId);
}
