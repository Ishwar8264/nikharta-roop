import type { Metadata } from "next";

import {
  GrievanceOfficer,
  LegalList,
  LegalSection,
  LegalShell,
} from "@/components/legal";
import { siteConfig } from "@/config/site";

const LAST_UPDATED = "September 28, 2026";
const SECTIONS = [
  { id: "scope", title: "1. Scope" },
  { id: "collection", title: "2. Personal Data We Collect" },
  { id: "use", title: "3. How We Use Personal Data" },
  { id: "sharing", title: "4. When We Share Data" },
  { id: "choices", title: "5. Consent and Your Choices" },
  { id: "retention", title: "6. Retention and Account Deletion" },
  { id: "rights", title: "7. Your Privacy Rights" },
  { id: "children", title: "8. Children's Data" },
  { id: "security", title: "9. Security" },
  { id: "cookies", title: "10. Cookies" },
  { id: "transfers", title: "11. Processing Outside India" },
  { id: "grievance", title: "12. Grievances and Complaints" },
  { id: "changes", title: "13. Changes to This Notice" },
];

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Nikharta Roop collects, uses, shares, retains, and protects personal data for salon bookings in India.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `Privacy Policy | ${siteConfig.name}`,
    description: "How Nikharta Roop handles personal data in India.",
    url: "/privacy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `Privacy Policy | ${siteConfig.name}`,
    description: "How Nikharta Roop handles personal data in India.",
  },
};

/** Renders Nikharta Roop's India-focused privacy notice as static HTML. */
export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      description="This notice explains what personal data we handle, why we use it, and the choices available to you when you use Nikharta Roop."
      lastUpdated={LAST_UPDATED}
      sections={SECTIONS}
    >
      <LegalSection id="scope" title="1. Scope">
        <p>
          {siteConfig.name} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
          operates a platform that
          helps customers discover salons and manage appointments in India. This
          notice applies to visitors, registered customers, and salon users who
          use our website, account features, or support channels.
        </p>
        <p>
          We handle digital personal data as a Data Fiduciary under India&apos;s
          Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;). The Act and
          the Digital Personal Data Protection Rules, 2025 have phased
          commencement dates; we will update our processes as further provisions
          become effective.
        </p>
      </LegalSection>

      <LegalSection id="collection" title="2. Personal Data We Collect">
        <LegalList
          items={[
            "Account details, such as name, email address, mobile number, password hash, profile photo, and optional profile information.",
            "Appointment details, including salon, services, staff preference, date and time, notes, status, and cancellation reason.",
            "Payment records associated with an appointment, such as amount, method, status, transaction reference, and refund amount. Do not enter a card PIN, UPI PIN, or CVV into your profile.",
            "Content you submit, such as reviews, ratings, comments, photos, support messages, and grievance details.",
            "Security and technical data, such as session records, IP address, browser or device information, and audit events.",
            "Optional approximate location when you choose to provide it for location-based features.",
          ]}
        />
        <p>
          Salon partners may separately collect information while providing a
          service. Their own privacy practices apply to data collected outside
          the Platform.
        </p>
      </LegalSection>

      <LegalSection id="use" title="3. How We Use Personal Data">
        <LegalList
          items={[
            "Create, verify, secure, and administer accounts and sessions.",
            "Create, confirm, reschedule, cancel, and maintain appointment history.",
            "Record payments and refunds associated with appointments.",
            "Send OTPs, service messages, appointment updates, and security notices.",
            "Display reviews and other content you choose to publish.",
            "Respond to support requests, privacy requests, and grievances.",
            "Detect misuse, protect users, troubleshoot the service, and maintain audit records.",
            "Meet applicable legal, accounting, tax, and regulatory obligations.",
          ]}
        />
        <p>
          We will not use consented personal data for a new purpose without the
          notice and choice required by applicable law.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="4. When We Share Data">
        <LegalList
          items={[
            "The salon and relevant staff for handling your appointment.",
            "Hosting, database, authentication, email, notification, and other service providers working for us.",
            "Payment service providers when online payment functionality is available.",
            "Professional advisers, authorities, or law-enforcement bodies where disclosure is legally required or necessary to protect rights and safety.",
            "A successor in a merger, restructuring, financing, or transfer of the Platform, subject to applicable law.",
          ]}
        />
        <p>We do not sell your personal data.</p>
      </LegalSection>

      <LegalSection id="choices" title="5. Consent and Your Choices">
        <p>
          Where processing relies on consent, you may withdraw it by stopping
          the optional feature, changing the relevant setting, or contacting us.
          Withdrawal does not affect processing already carried out. If the data
          is necessary for a requested feature, that feature may no longer work.
          We may still retain or process data where law requires or permits it.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="6. Retention and Account Deletion">
        <p>
          We keep data only while needed for the purposes in this notice, an
          active relationship, dispute handling, security, or a legal retention
          requirement. Periods vary by record type and context.
        </p>
        <p>
          Account deletion currently deactivates the account, revokes active
          sessions, and prevents further sign-in. Some linked appointment,
          review, payment, security, and audit records may remain to preserve
          transaction history, prevent fraud, resolve disputes, or comply with
          law. Contact us to request correction or erasure.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="7. Your Privacy Rights">
        <p>
          Subject to the applicable provisions and their commencement, the DPDP
          Act provides rights to obtain processing information, seek correction
          and erasure, use grievance redressal, and nominate another person to
          exercise rights in the event of death or incapacity.
        </p>
        <p>
          Email {siteConfig.contact.grievanceEmail} from your account address and
          describe the request. We may verify your identity before acting. If our
          response does not resolve a privacy grievance, you may use the
          statutory remedy available when the relevant provision is in force.
        </p>
      </LegalSection>

      <LegalSection id="children" title="8. Children's Data">
        <p>
          Accounts are intended for people who can enter a valid contract. We do
          not knowingly offer accounts directly to children. If we learn that a
          child&apos;s data was provided without legally required consent, we will
          take appropriate steps to restrict or erase it. A parent or lawful
          guardian may contact us using Section 12.
        </p>
      </LegalSection>

      <LegalSection id="security" title="9. Security">
        <p>
          We use safeguards appropriate to the data, including TLS in transit,
          hashed password storage, session controls, role-based authorisation,
          CSRF protection, rate limiting, and audit logging. No internet service
          can guarantee absolute security. If a breach occurs, we will
          investigate, mitigate harm, and make notifications where and when
          applicable law requires them.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="10. Cookies">
        <p>
          We use first-party cookies needed for sign-in, session refresh, OAuth
          security, theme preference, and CSRF protection. Authentication cookies
          are HttpOnly where appropriate; the CSRF cookie must be readable by the
          application so it can be returned in a request header. These cookies
          are not used for third-party behavioural advertising.
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="11. Processing Outside India">
        <p>
          Some providers may process data outside India. Where this occurs, we
          use contractual and security safeguards and comply with any transfer
          restriction notified by the Central Government under applicable law.
        </p>
      </LegalSection>

      <LegalSection id="grievance" title="12. Grievances and Complaints">
        <p>
          Include your account email or mobile number, a description of the
          concern, and any relevant appointment or transaction reference. Never
          send passwords, OTPs, card PINs, UPI PINs, or CVVs.
        </p>
        <GrievanceOfficer />
      </LegalSection>

      <LegalSection id="changes" title="13. Changes to This Notice">
        <p>
          We may update this notice when our services, processing practices, or
          legal obligations change. The revised notice will show a new update
          date. Where law requires a fresh notice or consent, we will provide it
          before the relevant processing begins.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
