import { NextResponse } from "next/server";

import { runCronJob, verifyCronSecret } from "@/server/cron/cron.runner";
import { runAppointmentRemindersJob } from "@/server/cron/jobs/appointment-reminders.job";

/**
 * Node.js runtime because the handler writes to Postgres via Prisma and
 * reads process.env — neither works on the Edge runtime.
 */
export const runtime = "nodejs";

/**
 * Maximum duration allowed by the platform.
 *
 * Why:
 * Hobby caps at 60s, Pro at 900s. The runner stops work at 50s regardless,
 * so setting the route cap to 60s keeps both plans working with the same
 * code and gives the runner a 10s buffer to flush its response.
 */
export const maxDuration = 60;

/**
 * Cron entrypoint for the appointment reminder job.
 *
 * Why:
 * The route is intentionally a two-line coordinator: verify the secret,
 * hand the work to the runner. Every guard, lock, and time check lives in
 * shared infrastructure so this file — and its siblings — stay trivial to
 * audit.
 *
 * GET is used because Vercel sends a GET for scheduled invocations.
 */
export async function GET(request: Request): Promise<Response> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await runCronJob({
    jobName: "appointment-reminders",
    handler: runAppointmentRemindersJob,
  });

  return NextResponse.json(
    { message: "Cron job finished", data: result },
    { status: 200 },
  );
}
