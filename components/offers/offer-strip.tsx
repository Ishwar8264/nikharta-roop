import { Badge } from "@/components/ui/badge";

type OfferStripProps = {
  titleHi: string;
  code: string;
};

export function OfferStrip({ titleHi, code }: OfferStripProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
      <p className="font-medium">{titleHi}</p>
      <Badge>{code}</Badge>
    </div>
  );
}
