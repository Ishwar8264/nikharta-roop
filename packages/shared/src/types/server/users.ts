/**
 * Public summary projection of a `User` row for staff-facing views.
 *
 * Why:
 * The customer-notes page is reached by salon staff viewing a customer they
 * already gate on (the page asserts salon membership before rendering). We
 * still want to expose only the minimum user fields required to label the
 * timeline header — never password, role escalation, loyalty points, or other
 * sensitive columns. This type is the contract between the users repository
 * (which selects exactly these columns) and any caller that renders a
 * customer summary.
 */
export interface PublicCustomerSummary {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
}
