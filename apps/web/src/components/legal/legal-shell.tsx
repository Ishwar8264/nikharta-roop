import { LegalToc } from "./legal-toc";

interface LegalShellProps {
  title: string;
  description: string;
  lastUpdated: string;
  sections: { id: string; title: string }[];
  children: React.ReactNode;
}

/**
 * Shared page shell for legal documents (privacy, terms, help).
 *
 * Why server component:
 * Legal pages are static prose. No state, no events — the entire page
 * renders on the server and ships as HTML. Zero client JS.
 *
 * Why a sticky TOC:
 * Indian DPDP Act 2023 requires a "standalone, plain-language notice".
 * A sticky table of contents makes the notice navigable instead of a
 * 5000-word wall — which is the difference between compliance and a
 * document nobody reads.
 */
export function LegalShell({
  title,
  description,
  lastUpdated,
  sections,
  children,
}: LegalShellProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Legal
        </p>
        <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-base text-muted-foreground">{description}</p>
        <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
          Last updated: <time dateTime="2026-09-28">{lastUpdated}</time>
        </p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <LegalToc sections={sections} />
        </aside>

        <article className="max-w-3xl space-y-10">{children}</article>
      </div>
    </div>
  );
}
