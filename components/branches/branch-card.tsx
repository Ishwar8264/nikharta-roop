import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PublicBranch } from "@/features/branches/types/branch.types";

type BranchCardProps = {
  branch: PublicBranch;
};

// Shared public branch card fed by the branch discovery API shape.
export function BranchCard({ branch }: BranchCardProps) {
  return (
    <Card className="bg-white/80">
      <CardHeader>
        <CardTitle>{branch.nameHi}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>{branch.nameEn ?? branch.city}</p>
        <p>{branch.address}</p>
        <p>{branch.phone}</p>
        <p>
          Open {branch.openTime.slice(0, 5)} - {branch.closeTime.slice(0, 5)}
        </p>
        {branch.googleMapsUrl ? (
          <Button asChild variant="outline">
            <a href={branch.googleMapsUrl} rel="noreferrer" target="_blank">
              View directions
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
