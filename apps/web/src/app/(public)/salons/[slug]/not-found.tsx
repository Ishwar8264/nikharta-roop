import { MapPinOff } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";

export default function SalonNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <MapPinOff className="h-6 w-6" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h2 className="font-heading text-xl font-semibold">Salon not found</h2>
        <p className="text-sm text-muted-foreground">
          This salon either does not exist or has been removed.
        </p>
      </div>

      <Button>
        <Link href={routes.salons}>Browse salons</Link>
      </Button>
    </div>
  );
}
