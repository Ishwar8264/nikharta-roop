"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

// Reads native form pending state for the profile server action.
export function ProfileSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} className="w-full bg-rose-900 text-white hover:bg-rose-800">
      {pending ? "Saving..." : "Save profile"}
    </Button>
  );
}
