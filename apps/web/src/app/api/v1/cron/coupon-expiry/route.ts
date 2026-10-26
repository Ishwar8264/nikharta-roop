import { NextResponse } from "next/server";

import { runCronJob, verifyCronSecret } from "@/server/cron/cron.runner";
import { runCouponExpiryJob } from "@/server/cron/jobs/coupon-expiry.job";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Cron entrypoint for the coupon expiry job. */
export async function GET(request: Request): Promise<Response> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await runCronJob({
    jobName: "coupon-expiry",
    handler: runCouponExpiryJob,
  });

  return NextResponse.json(
    { message: "Cron job finished", data: result },
    { status: 200 },
  );
}
