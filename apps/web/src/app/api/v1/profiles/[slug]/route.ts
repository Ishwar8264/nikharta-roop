import { handlePrivateApiError, jsonPrivateOk } from "@/lib/api-response";
import { deleteProfile, updateProfile } from "@/server/profile/profile";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/v1/profiles/[slug]">,
): Promise<Response> {
  try {
    const { slug } = await context.params;
    return jsonPrivateOk(await updateProfile(request, slug), "Profile updated.");
  } catch (error) {
    return handlePrivateApiError(error);
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext<"/api/v1/profiles/[slug]">,
): Promise<Response> {
  try {
    const { slug } = await context.params;
    await deleteProfile(request, slug);
    return new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return handlePrivateApiError(error);
  }
}
