/**
 * Purpose: Admin portfolio list for branch-managed gallery items.
 * Responsibilities: render publish status, branch context, linked resource details, and empty state.
 * Important notes: relation names are read defensively because API relation payloads may evolve.
 */
import { PortfolioCard } from "@/features/portfolio/components/portfolio-card";
import type { PublicPortfolioItem } from "@/features/portfolio/types/portfolio.types";

type AdminPortfolioListProps = {
  items: PublicPortfolioItem[];
};

/**
 * Renders portfolio cards for the admin management screen.
 */
export function AdminPortfolioList({ items }: AdminPortfolioListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border bg-white p-6 text-sm text-muted-foreground">
        No portfolio work has been added yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <PortfolioCard
          branch={formatBranchName(item.branch)}
          description={item.descriptionHi}
          imageUrls={getPortfolioImages(item)}
          isFeatured={item.isFeatured}
          isPublished={item.isPublished}
          key={item.id}
          meta={formatLinkedResource(item)}
          title={item.titleHi}
        />
      ))}
    </div>
  );
}

/**
 * Builds the image fallback chain used by cards.
 */
function getPortfolioImages(item: PublicPortfolioItem) {
  return [
    ...item.imageUrls,
    item.afterImageUrl,
    item.beforeImageUrl,
  ].filter((imageUrl): imageUrl is string => Boolean(imageUrl));
}

/**
 * Formats the branch label from the compact API relation.
 */
function formatBranchName(branch: PublicPortfolioItem["branch"]) {
  if (!branch) return undefined;

  const nameHi = readString(branch, "nameHi");
  const city = readString(branch, "city");

  return [nameHi, city].filter(Boolean).join(", ") || undefined;
}

/**
 * Shows whether the portfolio item is attached to a service, package, or staff member.
 */
function formatLinkedResource(item: PublicPortfolioItem) {
  const serviceName = item.service ? readString(item.service, "nameHi") : null;
  const packageName = item.package ? readString(item.package, "nameHi") : null;
  const staffName = item.staff ? readStaffName(item.staff) : null;

  return serviceName ?? packageName ?? staffName ?? undefined;
}

/**
 * Reads staff user.name from the nested staff relation safely.
 */
function readStaffName(staff: NonNullable<PublicPortfolioItem["staff"]>) {
  const user = staff.user;

  return isRecord(user) ? readString(user, "name") : null;
}

/**
 * Reads a string property from relation records without trusting shape drift.
 */
function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Narrows unknown nested relation values before reading from them.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
