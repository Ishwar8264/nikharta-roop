import Link from "next/link";

import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Root 404 page.
 *
 * Why at the root:
 * It catches unmatched URLs from every route group — public pages, auth,
 * and dashboards — with one branded, linkable fallback.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="h-6 w-6" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h2 className="font-heading text-xl font-semibold">
          Page not found
        </h2>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist or may have moved.
        </p>
      </div>

      <Button render={<Link href="/" />}>Back to home</Button>
    </div>
  );
}
