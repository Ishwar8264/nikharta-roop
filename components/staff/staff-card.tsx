import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

type StaffCardProps = {
  name: string;
  specialization: string;
  photoUrl?: string;
};

export function StaffCard({ name, specialization, photoUrl }: StaffCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={photoUrl} alt={name} />
          <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{specialization}</p>
        </div>
      </CardContent>
    </Card>
  );
}
