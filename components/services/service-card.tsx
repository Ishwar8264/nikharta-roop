import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ServiceCardProps = {
  nameHi: string;
  nameEn?: string;
  price: string;
  duration: string;
  category?: string;
};

export function ServiceCard({ nameHi, nameEn, price, duration, category }: ServiceCardProps) {
  return (
    <Card>
      <CardHeader>
        {category ? <Badge className="w-fit">{category}</Badge> : null}
        <CardTitle>{nameHi}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {nameEn ? <p>{nameEn}</p> : null}
        <p>{duration}</p>
        <p className="font-semibold text-foreground">{price}</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">अभी बुक करें</Button>
      </CardFooter>
    </Card>
  );
}
