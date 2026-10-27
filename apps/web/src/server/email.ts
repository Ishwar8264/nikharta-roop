import "server-only";

import { Resend } from "resend";

/** Fail explicitly on delivery failure. Never log reset links, passwords, or OTPs. */
export async function sendAuthEmail(email: string, subject: string, content: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) throw new Error("Authentication email is not configured");
  const { error } = await new Resend(key).emails.send({
    from,
    to: email,
    subject: `${subject} | Nikharta Roop`,
    text: `${subject}\n\n${content}\n\nDo not share this message. If you did not request this, you can ignore it.`,
  });
  if (error) throw new Error("Authentication email could not be delivered");
}
