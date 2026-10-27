interface LegalListProps {
  items: React.ReactNode[];
  ordered?: boolean;
}

/**
 * Styled list for legal documents.
 *
 * Why extracted:
 * Every section uses a bullet list for enumerated rights, obligations, or
 * data categories. One component keeps the spacing and marker style
 * consistent — legal documents are read in scans, not paragraphs, and
 * inconsistent list rhythm destroys that.
 */
export function LegalList({ items, ordered = false }: LegalListProps) {
  const Tag = ordered ? "ol" : "ul";
  const markerClass = ordered ? "list-decimal" : "list-disc";

  return (
    <Tag className={`${markerClass} space-y-1.5 pl-5`}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </Tag>
  );
}
