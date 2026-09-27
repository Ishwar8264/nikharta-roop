"use client";

import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface OAuthOption {
  id: "google" | "apple" | "facebook";
  displayName: string;
}

interface OAuthButtonsProps extends ComponentProps<"div"> {
  providers: readonly OAuthOption[];
  disabled?: boolean;
}

/**
 * Renders OAuth entry points shared by login and registration.
 *
 * Why anchors:
 * OAuth must perform a full document navigation so the route handler can
 * issue state and PKCE cookies before redirecting to the provider.
 */
export function OAuthButtons({
  providers,
  disabled = false,
  className,
  ...props
}: OAuthButtonsProps) {
  if (providers.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div
        className="grid gap-2"
        role="group"
        aria-label="Continue with a provider"
      >
        {providers.map((provider) => (
          <Button
            key={provider.id}
            variant="outline"
            className="w-full"
            nativeButton={false}
            disabled={disabled}
            render={
              <a href={`/api/v1/auth/oauth/${provider.id}`} />
            }
          >
            Continue with {provider.displayName}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-3" aria-hidden="true">
        <Separator className="flex-1" />
        <span className="shrink-0 text-xs text-muted-foreground">
          or continue with email
        </span>
        <Separator className="flex-1" />
      </div>
    </div>
  );
}
