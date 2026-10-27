import { handlePrivateApiError, jsonPrivateOk } from "@/lib/api-response";
import { createProfile } from "@/server/profile/profile";

/** HTTP mapping only; profile validation, account checks, and writes live in the server layer. */
export async function POST(request: Request): Promise<Response> {
  try {
    return jsonPrivateOk(await createProfile(request), "Profile created.", { status: 201 });
  } catch (error) {
    return handlePrivateApiError(error);
  }
}
