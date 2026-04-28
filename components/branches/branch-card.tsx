import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type BranchCardProps = {
  nameHi: string;
  address: string;
  phone: string;
  mapsUrl?: string;
};

export function BranchCard({ nameHi, address, phone, mapsUrl }: BranchCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{nameHi}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>{address}</p>
        <p>{phone}</p>
        {mapsUrl ? <Button asChild><a href={mapsUrl}>दिशा देखें</a></Button> : null}
      </CardContent>
    </Card>
  );
}
