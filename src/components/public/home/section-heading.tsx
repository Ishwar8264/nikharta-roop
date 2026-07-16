// Describe the compact heading shared by public landing-page sections.
type SectionHeadingProps = {
  // Explain why the section matters to a first-time visitor.
  description: string;
  // Show a short category label above the editorial heading.
  eyebrow: string;
  // Give the section one clear customer-facing message.
  title: string;
};

// Render consistent section hierarchy without introducing client behavior.
export function SectionHeading({
  description,
  eyebrow,
  title,
}: SectionHeadingProps) {
  // Keep headings readable across narrow phones and wide desktop sections.
  return (
    <div className="max-w-2xl">
      {/* Use the primary color for a compact section category. */}
      <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
        {eyebrow}
      </p>
      {/* Reuse the established display font for editorial page hierarchy. */}
      <h2 className="font-display mt-3 text-3xl leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {/* Keep supporting copy within a comfortable reading measure. */}
      <p className="mt-4 max-w-[62ch] text-base leading-7 text-muted-foreground sm:text-lg">
        {description}
      </p>
    </div>
  );
}
