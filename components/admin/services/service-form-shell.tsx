import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ServiceFormShell() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>सेवा जोड़ें</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name_hi">हिंदी नाम</Label>
          <Input id="name_hi" placeholder="फेशियल" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="price">कीमत</Label>
          <Input id="price" inputMode="decimal" placeholder="₹ 500" />
        </div>
      </CardContent>
      <CardFooter>
        <Button>सेव करें</Button>
      </CardFooter>
    </Card>
  );
}
