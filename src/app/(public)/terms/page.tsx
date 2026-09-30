import type { Metadata } from "next";
import Link from "next/link";

import {
  GrievanceOfficer,
  LegalList,
  LegalSection,
  LegalShell,
} from "@/components/legal";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

const LAST_UPDATED = "September 28, 2026";
const SECTIONS = [
  { id: "agreement", title: "1. Agreement and Eligibility" },
  { id: "platform", title: "2. Platform Role" },
  { id: "account", title: "3. Your Account" },
  { id: "bookings", title: "4. Bookings and Cancellations" },
  { id: "payments", title: "5. Prices, Payments, and Refunds" },
  { id: "partners", title: "6. Salon Partners" },
  { id: "conduct", title: "7. Acceptable Use" },
  { id: "content", title: "8. Reviews and User Content" },
  { id: "ip", title: "9. Intellectual Property" },
  { id: "availability", title: "10. Availability and Changes" },
  { id: "liability", title: "11. Responsibility and Liability" },
  { id: "grievance", title: "12. Grievance Redressal" },
  { id: "law", title: "13. Governing Law and Disputes" },
  { id: "changes", title: "14. Changes to These Terms" },
];

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms for using Nikharta Roop, including salon bookings, cancellations, payments, reviews, and grievance redressal in India.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: `Terms of Service | ${siteConfig.name}`,
    description: "Terms for salon bookings and accounts on Nikharta Roop.",
    url: "/terms",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `Terms of Service | ${siteConfig.name}`,
    description: "Terms for salon bookings and accounts on Nikharta Roop.",
  },
};

/** Renders the terms governing use of the Nikharta Roop Platform in India. */
export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      description="These Terms govern your access to and use of Nikharta Roop. Read them with our Privacy Policy before creating an account or booking an appointment."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    >
      <LegalSection id="agreement" title="1. Agreement and Eligibility">
        <p>
          By using {siteConfig.name} (the &quot;Platform&quot;), you agree to these Terms
          and our{" "}
          <Link className="text-foreground underline" href={routes.privacy}>
            Privacy Policy
          </Link>
          . Electronic acceptance forms an agreement under applicable Indian
          law. If you do not agree, do not use the Platform.
        </p>
        <p>
          You must be at least 18 years old and competent to contract under the
          Indian Contract Act, 1872 to create an account. A parent or lawful
          guardian must arrange a service for a minor.
        </p>
      </LegalSection>

      <LegalSection id="platform" title="2. Platform Role">
        <p>
          The Platform helps users discover salons and request or manage
          appointments. Unless a booking screen says otherwise, the salon is the
          service provider and is responsible for performing the beauty or
          wellness service. We provide technology and booking support.
        </p>
      </LegalSection>

      <LegalSection id="account" title="3. Your Account">
        <LegalList
          items={[
            "Provide accurate, current information and keep it updated.",
            "Keep credentials and OTPs confidential and promptly report suspected unauthorised access.",
            "Accept responsibility for account activity, except to the extent caused by our breach of duty.",
            "Do not impersonate another person or use their account without permission.",
          ]}
        />
        <p>
          We may restrict or deactivate an account when reasonably necessary for
          security, suspected fraud, unlawful activity, repeated misuse, or a
          material breach. Where appropriate, we will provide notice and a way to
          contact support.
        </p>
      </LegalSection>

      <LegalSection id="bookings" title="4. Bookings and Cancellations">
        <p>
          A submitted appointment is subject to availability and its status in
          the Platform. Review the salon, service, staff, time, price, and any
          salon-specific condition before confirming.
        </p>
        <LegalList
          items={[
            "You may request cancellation or rescheduling through appointment controls available to you.",
            "Any cancellation fee, deposit treatment, or refund condition must be displayed or communicated for that booking; no universal four-hour rule applies under these Terms.",
            "A salon may cancel or reschedule because of staff availability, safety, operational issues, or events outside reasonable control. We will surface the changed status through available notification channels.",
            "Arrive on time and tell the salon about relevant allergies, sensitivities, health conditions, or accessibility needs before a service begins.",
          ]}
        />
      </LegalSection>

      <LegalSection id="payments" title="5. Prices, Payments, and Refunds">
        <p>
          Prices are displayed in Indian Rupees. The booking flow should identify
          applicable taxes, fees, discounts, deposits, and the payable amount
          before confirmation. Payment options may include payment at the salon
          or an online method when enabled.
        </p>
        <p>
          Refund eligibility depends on the displayed booking condition, the
          cancellation reason, service delivery, and applicable consumer law. An
          approved refund uses the available payment process; bank or
          payment-system timelines may vary. For a failed electronic transaction,
          contact your bank or payment provider and us with the transaction
          reference. Never share a PIN, OTP, CVV, or password.
        </p>
      </LegalSection>

      <LegalSection id="partners" title="6. Salon Partners">
        <p>
          Salon partners control their staff, premises, schedules, service
          descriptions, and performance. Information supplied by a salon should
          be accurate, but availability and results may vary. Raise a service or
          billing concern with the salon and, if unresolved, use our grievance
          channel below.
        </p>
      </LegalSection>

      <LegalSection id="conduct" title="7. Acceptable Use">
        <p>You must not:</p>
        <LegalList
          items={[
            "Use the Platform for an unlawful, fraudulent, abusive, or misleading purpose.",
            "Harass, threaten, discriminate against, or endanger another user, salon worker, or support representative.",
            "Attempt unauthorised access, disrupt security, introduce malicious code, or overload the Platform.",
            "Scrape or systematically copy the Platform unless law permits it or we give written permission.",
            "Post content that infringes rights, is defamatory or obscene, invades privacy, or is otherwise unlawful.",
            "Make sham bookings, manipulate reviews, misuse offers, or initiate a knowingly false payment dispute.",
          ]}
        />
      </LegalSection>

      <LegalSection id="content" title="8. Reviews and User Content">
        <p>
          You retain ownership of submitted content. You give us a non-exclusive,
          worldwide, royalty-free licence to host, reproduce, format, and display
          it only as needed to operate, promote, secure, and improve the Platform.
          The licence ends when content is deleted, except for cached copies,
          legal retention, and content already shared through your chosen feature.
        </p>
        <p>
          Reviews must reflect a genuine experience. We may moderate, restrict,
          or remove content to enforce these Terms, respond to a valid legal
          notice, or protect users. To report content, provide its URL or other
          identifying details through the grievance channel.
        </p>
      </LegalSection>

      <LegalSection id="ip" title="9. Intellectual Property">
        <p>
          Platform software, visual design, and brand assets belong to us or our
          licensors. These Terms provide a limited, revocable, non-transferable
          right to use the Platform for its intended purpose; they do not transfer
          intellectual-property ownership.
        </p>
      </LegalSection>

      <LegalSection id="availability" title="10. Availability and Changes">
        <p>
          We may maintain, secure, change, suspend, or discontinue a feature.
          Uninterrupted or error-free operation is not guaranteed. We will try to
          give reasonable notice of a material discontinuation where practical.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="11. Responsibility and Liability">
        <p>
          Each party remains responsible for loss caused by its acts or omissions
          as determined under applicable law. To the extent permitted by law, we
          are not responsible for indirect loss that was not reasonably
          foreseeable, a salon&apos;s independent service, or an event outside our
          reasonable control.
        </p>
        <p>
          Nothing in these Terms excludes liability, remedies, or consumer rights
          that cannot lawfully be excluded, including rights under the Consumer
          Protection Act, 2019 and applicable rules.
        </p>
      </LegalSection>

      <LegalSection id="grievance" title="12. Grievance Redressal">
        <p>
          Send complaints with your account contact, appointment or transaction
          reference, and a clear description. Consumer grievances are
          acknowledged within 48 hours and we aim to resolve them within one
          month, consistent with the Consumer Protection (E-Commerce) Rules,
          2020. Content or intermediary complaints may have a shorter applicable
          timeline.
        </p>
        <GrievanceOfficer />
      </LegalSection>

      <LegalSection id="law" title="13. Governing Law and Disputes">
        <p>
          These Terms are governed by Indian law. Please first use the grievance
          process so we can try to resolve the issue. Nothing restricts your
          right to approach a consumer commission, court, or other authority
          having jurisdiction under applicable law.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="14. Changes to These Terms">
        <p>
          We may revise these Terms for legal, security, operational, or service
          changes. The revised version will show a new update date. We will give
          reasonable advance notice when a change materially affects existing
          users, unless an urgent legal or security reason requires faster action.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
