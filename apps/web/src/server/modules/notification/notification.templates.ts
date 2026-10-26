import "server-only";

/**
 * Inline HTML templates for transactional emails.
 *
 * Why:
 * A full template engine (React Email, MJML) is overkill for the handful of
 * transactional messages this platform sends. Plain template literals keep
 * the build fast and the output stable, and the file is the single place a
 * designer needs to touch to rebrand.
 */
export interface TemplateContent {
  subject: string;
  html: string;
  text: string;
}

const BRAND = "Nikharta Roop";

function wrap(bodyHtml: string): string {
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: auto; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 16px; color: #111;">${BRAND}</h2>
      ${bodyHtml}
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="font-size: 12px; color: #666;">
        You are receiving this because you have an account with ${BRAND}.
      </p>
    </div>
  `;
}

/** Appointment confirmation email. */
export function appointmentConfirmedTemplate(input: {
  customerName: string;
  salonName: string;
  startTime: string;
  services: string[];
}): TemplateContent {
  const serviceList = input.services.map((s) => `<li>${s}</li>`).join("");
  return {
    subject: `Your booking at ${input.salonName} is confirmed`,
    html: wrap(`
      <p>Hi ${input.customerName},</p>
      <p>Your booking at <strong>${input.salonName}</strong> is confirmed for <strong>${input.startTime}</strong>.</p>
      <ul>${serviceList}</ul>
      <p>See you soon!</p>
    `),
    text: `Hi ${input.customerName}, your booking at ${input.salonName} is confirmed for ${input.startTime}.`,
  };
}

/** Appointment reminder email (sent ~24h before). */
export function appointmentReminderTemplate(input: {
  customerName: string;
  salonName: string;
  startTime: string;
}): TemplateContent {
  return {
    subject: `Reminder: your appointment at ${input.salonName}`,
    html: wrap(`
      <p>Hi ${input.customerName},</p>
      <p>Just a reminder that your appointment at <strong>${input.salonName}</strong> is scheduled for <strong>${input.startTime}</strong>.</p>
    `),
    text: `Reminder: your appointment at ${input.salonName} is on ${input.startTime}.`,
  };
}

/** Appointment cancellation email. */
export function appointmentCancelledTemplate(input: {
  customerName: string;
  salonName: string;
  startTime: string;
  reason: string | null;
}): TemplateContent {
  return {
    subject: `Your booking at ${input.salonName} was cancelled`,
    html: wrap(`
      <p>Hi ${input.customerName},</p>
      <p>Your booking at <strong>${input.salonName}</strong> on ${input.startTime} has been cancelled.</p>
      ${input.reason ? `<p><strong>Reason:</strong> ${input.reason}</p>` : ""}
    `),
    text: `Your booking at ${input.salonName} on ${input.startTime} has been cancelled.`,
  };
}

/** Loyalty points earned email. */
export function loyaltyEarnedTemplate(input: {
  customerName: string;
  points: number;
  balance: number;
}): TemplateContent {
  return {
    subject: `You earned ${input.points} loyalty points`,
    html: wrap(`
      <p>Hi ${input.customerName},</p>
      <p>You just earned <strong>${input.points} points</strong> from your recent visit.</p>
      <p>Your new balance is <strong>${input.balance} points</strong>.</p>
    `),
    text: `You earned ${input.points} points. New balance: ${input.balance}.`,
  };
}

/** Generic fallback for notifications with no template. */
export function genericTemplate(input: {
  title: string;
  body: string;
}): TemplateContent {
  return {
    subject: input.title,
    html: wrap(`<p>${input.body}</p>`),
    text: input.body,
  };
}
