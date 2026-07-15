// Load the shared button styles used by the final landing-page actions.
import { Button } from "@/src/components/ui/button";
// Load focused icons that clarify the two available next steps.
import { ArrowRight, UserRoundPlus } from "lucide-react";
// Load optimized server-rendered navigation for the conversion actions.
import Link from "next/link";

// End the discovery page with honest next steps instead of an unavailable booking form.
export function HomeCallToAction() {
  // Keep the final action focused on exploration and optional account creation.
  return (
    <section className="bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
      {/* Use one premium panel that stays readable in both active themes. */}
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-primary-foreground shadow-salon sm:px-10 sm:py-16 lg:px-16">
        {/* Balance the closing message with two clear actions on wider screens. */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          {/* Keep conversion copy direct and free from unsupported availability promises. */}
          <div className="max-w-3xl">
            <p className="text-xs font-bold tracking-[0.2em] uppercase opacity-80">
              Your next look starts here
            </p>
            <h2 className="font-display mt-4 text-4xl leading-tight font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
              Take your time. Find what feels like you.
            </h2>
            <p className="mt-5 max-w-[60ch] text-base leading-7 opacity-85 sm:text-lg">
              Explore the salon experience first, then create an account when you
              are ready to keep your journey organized.
            </p>
          </div>

          {/* Keep service discovery primary and signup optional. */}
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            {/* Use the light card surface for the main action on the plum panel. */}
            <Button
              asChild
              className="min-h-12 bg-card px-6 text-card-foreground hover:bg-card/90"
              size="lg"
            >
              <Link href="/services">
                Explore services
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            {/* Keep account creation visually secondary to public exploration. */}
            <Button
              asChild
              className="min-h-12 border-primary-foreground/35 bg-transparent px-6 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              size="lg"
              variant="outline"
            >
              <Link href="/signup">
                <UserRoundPlus aria-hidden="true" className="size-4" />
                Create account
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
