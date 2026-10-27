import { handlePrivateApiError, jsonPrivateOk } from "@/lib/api-response";
import { getMe } from "@/server/me/me";

/** Returns the authenticated account; parsing, identity checks, and rate limits belong to the service. */
export async function GET(request: Request): Promise<Response> {
  try {
    return jsonPrivateOk(await getMe(request));
  } catch (error) {
    return handlePrivateApiError(error);
  }
}
