interface LegalSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

/**
 * One titled section of a legal document.
 *
 * Why `scroll-mt-24`:
 * The public header is `sticky top-0` and 4rem tall. Without an offset, an
 * anchor jump lands with the heading hidden under the header. 24 = 6rem —
 * header height plus a comfortable reading gap.
 *
 * Why a real <section> with an id:
 * Screen readers announce "section" and the anchor TOC works without JS.
 * A <div> would force the same behavior through ARIA roles for no gain.
 */
export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
