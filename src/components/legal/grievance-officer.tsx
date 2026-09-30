import { siteConfig } from "@/config/site";

/**
 * Shared grievance-contact block for the legal pages.
 *
 * Why a dedicated component:
 * Keeping the live contact details in siteConfig prevents the legal pages
 * from drifting away from the support details shown elsewhere.
 */
export function GrievanceOfficer() {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-5 text-sm">
      <p className="font-semibold text-foreground">
        Grievance and privacy contact
      </p>
      <dl className="mt-3 space-y-1.5 text-muted-foreground">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0">Team</dt>
          <dd className="text-foreground">{siteConfig.name} Support</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0">Email</dt>
          <dd>
            <a
              href={`mailto:${siteConfig.contact.grievanceEmail}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {siteConfig.contact.grievanceEmail}
            </a>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0">Phone</dt>
          <dd className="text-foreground">{siteConfig.contact.phone}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0">Response</dt>
          <dd className="text-foreground">
            We acknowledge complaints within 48 hours and aim to resolve them
            within one month.
          </dd>
        </div>
      </dl>
    </div>
  );
}
