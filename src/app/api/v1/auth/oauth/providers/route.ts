import { NextResponse } from "next/server";

import { listOAuthProviders } from "@/server/auth/oauth/providers";

/**
 * Lists every OAuth provider the platform supports, along with a
 * `configured` flag.
 *
 * Why:
 * The login page needs to know which buttons to render. A provider without
 * credentials in the environment must not be advertised — clicking it would
 * only produce a 503. Returning the list from the server means the UI stays
 * in sync with the deployment without a separate build-time config.
 */
export async function GET(): Promise<Response> {
  const providers = listOAuthProviders().filter((p) => p.configured);

  return NextResponse.json(
    { message: "OAuth providers retrieved", data: providers },
    { status: 200 },
  );
}
