import { z } from "zod";
import { PARTNER_TERMS_VERSION } from "@/features/onboarding/policy";

export const onboardingDraftSchema = z.strictObject({
  accountType: z.enum(["CUSTOMER", "SALON_PARTNER"]),
  name: z.string().trim().min(2).max(100).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/)
    .optional(),
});

export const onboardingSchema = z
  .strictObject({
    accountType: z.enum(["CUSTOMER", "SALON_PARTNER"]),
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .max(100),
    phone: z
      .string()
      .trim()
      .regex(
        /^\+[1-9]\d{7,14}$/,
        "Use an international phone number, e.g. +919876543210",
      )
      .optional(),
    authorised: z.boolean().optional(),
    acceptTerms: z.boolean().optional(),
    termsVersion: z.string().optional(),
  })
  .superRefine((input, ctx) => {
    if (input.accountType !== "SALON_PARTNER") return;
    for (const [field, valid, message] of [
      ["phone", Boolean(input.phone), "Business contact phone is required"],
      [
        "authorised",
        input.authorised === true,
        "Confirm you are authorised to represent your salon",
      ],
      [
        "acceptTerms",
        input.acceptTerms === true,
        "Accept the partner terms to continue",
      ],
      [
        "termsVersion",
        input.termsVersion === PARTNER_TERMS_VERSION,
        "Terms have changed. Refresh and review them again",
      ],
    ] as const)
      if (!valid) ctx.addIssue({ code: "custom", path: [field], message });
  });
