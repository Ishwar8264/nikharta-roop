"use client";

import { Save } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

// Reads pending state from the avatar URL save form.
export function AvatarSaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} size="sm" type="submit">
      <Save className="size-3.5" />
      {pending ? "Saving..." : "Save avatar"}
    </Button>
  );
}
