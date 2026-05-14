"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

// Separate button keeps remove pending state tied to its own form.
export function AvatarRemoveButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      disabled={pending}
      size="sm"
      type="submit"
      variant="destructive"
    >
      <Trash2 className="size-3.5" />
      {pending ? "Removing..." : "Remove"}
    </Button>
  );
}
