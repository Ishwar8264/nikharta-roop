import { NextResponse } from "next/server";

import { runCronJob, verifyCronSecret } from "@/server/cron/cron.runner";
import { runTokenCleanupJob } from "@/server/cron/jobs/token-cleanup.job";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Cron entrypoint for the refresh token cleanup job. */
export async function GET(request: Request): Promise<Response> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await runCronJob({
    jobName: "token-cleanup",
    handler: runTokenCleanupJob,
  });

  return NextResponse.json(
    { message: "Cron job finished", data: result },
    { status: 200 },
  );
}
