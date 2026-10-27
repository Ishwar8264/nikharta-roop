import { jsonPrivateOk } from "@/lib/api-response";
import { handleProfileApiError } from "@/lib/profile-response";
import { createProfile, listProfiles } from "@/server/profile/profile";

/** HTTP mapping only; profile validation, account checks, and writes live in the server layer. */
export async function POST(request: Request): Promise<Response> {
  try {
    return jsonPrivateOk(await createProfile(request), "Profile created successfully.", { status: 201 });
  } catch (error) {
    return handleProfileApiError(error);
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    const result = await listProfiles(request);
    return jsonPrivateOk(result, result.items.length ? "Profiles retrieved successfully." : "No profiles match your filters.");
  } catch (error) {
    return handleProfileApiError(error);
  }
}
