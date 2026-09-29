import { SectionHeading } from "@/components/shared/section-heading";
import { serviceCategories } from "@/config/home";

/**
 * Service categories — a quick "what can I book?" answer.
 *
 * Why a category grid and not a search box here:
 * A first-time visitor doesn't know what to search for. Categories give them
 * a menu to browse, which is a lower-commitment first action than typing.
 *
 * The cards stay informational until a supported global discovery endpoint
 * exists. Salon-specific service browsing remains available on salon pages.
 */
export function ServiceCategories() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading
        eyebrow="Browse"
        title="What are you booking today?"
        description="From a quick trim to a full bridal package — find the right service."
      />

      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {serviceCategories.map((category) => {
          const Icon = category.icon;

          return (
            <article
              key={category.slug}
              className="group flex min-h-48 flex-col items-center justify-center gap-4 rounded-2xl border border-border/80 bg-card p-5 text-center shadow-sm"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>

              <div>
                <p className="font-heading text-sm font-semibold text-foreground">
                  {category.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {category.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
