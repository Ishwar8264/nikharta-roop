import { Mail, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { JsonLd } from "@/lib/seo/json-ld";

const LAST_UPDATED = "September 28, 2026";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "Get help with Nikharta Roop salon bookings, cancellations, account access, payments, refunds, and privacy in India.",
  alternates: { canonical: "/help" },
  openGraph: {
    title: `Help Center | ${siteConfig.name}`,
    description: "Help with salon bookings and your Nikharta Roop account.",
    url: "/help",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `Help Center | ${siteConfig.name}`,
    description: "Help with salon bookings and your Nikharta Roop account.",
  },
};

interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQS: Faq[] = [
  {
    id: "book-appointment",
    category: "Booking",
    question: "How do I book an appointment?",
    answer:
      "Create an account, browse available salons, choose services and an available time, then submit the appointment. Track its current status from your appointments area.",
  },
  {
    id: "cancel-booking",
    category: "Booking",
    question: "Can I cancel a booking?",
    answer:
      "Open the appointment and use the cancellation control when it is available for its current status. Review any salon-specific cancellation or refund condition shown for the booking.",
  },
  {
    id: "reschedule",
    category: "Booking",
    question: "Can I reschedule?",
    answer:
      "Use the reschedule control on an eligible appointment and choose an available time. The Platform keeps the original appointment in the history and creates the replacement booking.",
  },
  {
    id: "payment-methods",
    category: "Payments",
    question: "What payment methods do you accept?",
    answer:
      "Available payment methods are shown during the booking or by the salon. They may include payment at the salon and, when enabled, online methods. Rely on the checkout screen for the methods available to your booking.",
  },
  {
    id: "refund",
    category: "Payments",
    question: "How long does a refund take?",
    answer:
      "Refund eligibility depends on the booking condition, cancellation reason, and applicable consumer law. Once approved, timing depends on the payment method, bank, and payment provider.",
  },
  {
    id: "failed-payment",
    category: "Payments",
    question: "My payment failed but money was deducted. What now?",
    answer:
      "Keep the transaction reference and check its status with your bank or payment provider. RBI reversal timelines vary by transaction type. Contact us with the reference if the booking or payment status is incorrect. Never share an OTP, PIN, CVV, or password.",
  },
  {
    id: "verify-email",
    category: "Account",
    question: "I did not receive the verification email.",
    answer:
      "Check your spam and promotions folders. If it is still missing after 5 minutes, open the verify page and request a new code. You can request one new code every 60 seconds.",
  },
  {
    id: "forgot-password",
    category: "Account",
    question: "I forgot my password.",
    answer:
      "Use the Forgot password link on the sign-in page. We will email you a 6-digit code to reset it. The code expires in 10 minutes for security.",
  },
  {
    id: "delete-account",
    category: "Account",
    question: "How do I delete my account?",
    answer:
      "Use the Delete account option in Settings and confirm your password. This deactivates the account and revokes active sessions. Some appointment, review, payment, security, or audit records may remain where needed for transaction history, disputes, fraud prevention, or legal compliance.",
  },
  {
    id: "privacy",
    category: "Privacy",
    question: "How is my data handled?",
    answer:
      "We collect only what is necessary to run the platform and never sell your data. Full details, including your rights under the DPDP Act, 2023, are in our Privacy Policy.",
  },
];

/**
 * Help Center.
 *
 * Why an FAQ page and not a ticket system:
 * The overwhelming majority of support requests are the same ten questions.
 * Answering them in a crawlable, indexable page reduces ticket volume and
 * lets search engines surface the answer before a user ever contacts us.
 *
 * Why static:
 * These answers change on the order of months. Rendering them server-side
 * with zero client JS keeps the page instant and cacheable at the CDN edge.
 */
export default function HelpPage() {
  const categories = Array.from(new Set(FAQS.map((f) => f.category)));
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <JsonLd data={faqJsonLd} />
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Support
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Help Center
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Answers to the questions we get most often. If yours is not here,
          reach us using the contact options below.
        </p>
        <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
          Last updated: <time dateTime="2026-09-28">{LAST_UPDATED}</time>
        </p>
      </header>

      {/* ─── Contact channels ─── */}
      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <a
          href={`mailto:${siteConfig.contact.email}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Email us</p>
            <p className="truncate text-xs text-muted-foreground">
              {siteConfig.contact.email}
            </p>
          </div>
        </a>

        <a
          href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Call us</p>
            <p className="truncate text-xs text-muted-foreground">
              {siteConfig.contact.phone}
            </p>
          </div>
        </a>

        <a
          href={`mailto:${siteConfig.contact.grievanceEmail}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <MessageCircle className="h-5 w-5 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Grievance</p>
            <p className="truncate text-xs text-muted-foreground">
              {siteConfig.contact.grievanceEmail}
            </p>
          </div>
        </a>
      </section>

      {/* ─── FAQ by category ─── */}
      {categories.map((category) => (
        <section key={category} className="mt-14">
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
            {category}
          </h2>

          <dl className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
            {FAQS.filter((f) => f.category === category).map((faq) => (
              <div key={faq.id} className="p-5">
                <dt className="text-sm font-semibold text-foreground">
                  {faq.question}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {/* ─── Footer note ─── */}
      <section className="mt-16 rounded-xl border border-border bg-muted/30 p-6">
        <p className="text-sm text-muted-foreground">
          Still need help? Read our{" "}
          <Link
            href={routes.privacy}
            className="text-foreground underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>{" "}
          or{" "}
          <Link
            href={routes.terms}
            className="text-foreground underline-offset-4 hover:underline"
          >
            Terms of Service
          </Link>
          , or email our support team.
        </p>
      </section>
    </div>
  );
}
