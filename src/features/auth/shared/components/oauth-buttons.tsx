"use client";

import type { ComponentProps } from "react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface OAuthOption {
  id: "google" | "apple" | "facebook";
  displayName: string;
}

interface OAuthButtonsProps extends ComponentProps<"div"> {
  providers: readonly OAuthOption[];
}

/**
 * Renders compact OAuth links shared by login and registration.
 *
 * Why anchors:
 * OAuth must perform a full document navigation so the route handler can
 * issue state and PKCE cookies before redirecting to the provider.
 */
export function OAuthButtons({
  providers,
  className,
  ...props
}: OAuthButtonsProps) {
  if (providers.length === 0) return null;

  return (
    <div
      className={cn(
        "w-full space-y-3 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3" aria-hidden="true">
        <Separator className="flex-1" />
        <span className="shrink-0">Or continue with</span>
        <Separator className="flex-1" />
      </div>
      <div
        className="flex items-center justify-center gap-5"
        role="group"
        aria-label="Continue with a provider"
      >
        {providers.map((provider) => (
          <a
            key={provider.id}
            href={`/api/v1/auth/oauth/${provider.id}`}
            aria-label={`Continue with ${provider.displayName}`}
            title={`Continue with ${provider.displayName}`}
            className="text-foreground transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            <ProviderLogo provider={provider.id} />
          </a>
        ))}
      </div>
    </div>
  );
}

function ProviderLogo({ provider }: { provider: OAuthOption["id"] }) {
  if (provider === "google") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#4285F4"
          d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
        />
        <path
          fill="#34A853"
          d="M12 22c2.7 0 4.97-.9 6.63-2.42l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z"
        />
        <path
          fill="#FBBC05"
          d="M6.39 13.88A6.02 6.02 0 0 1 6.08 12c0-.65.11-1.28.31-1.88V7.51H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.49l3.35-2.61Z"
        />
        <path
          fill="#EA4335"
          d="M12 5.99c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.61C7.18 7.75 9.39 6 12 6Z"
        />
      </svg>
    );
  }

  if (provider === "apple") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-5 fill-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.21 3.09 3.79 3.04 1.52-.07 2.09-.99 3.94-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.16-1.69 1.64-3.33 1.66-3.42-.04-.01-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.62-2.32-4.39-2.38-2-.16-3.68 1.09-4.61 1.09Zm3.38-3.07c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.66.81-3.53 1.82-.78.9-1.45 2.34-1.27 3.71 1.34.1 2.72-.69 3.56-1.7Z" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 fill-[#1877F2]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9.1 23.69v-7.98H6.63v-3.67H9.1v-1.58c0-4.09 1.85-5.98 5.86-5.98.4 0 .95.04 1.47.1.48.06.86.13 1.14.2v3.33a8.62 8.62 0 0 0-.65-.04c-.25-.01-.5-.01-.73-.01-.71 0-1.26.1-1.68.31-.29.15-.52.35-.68.62-.26.42-.37 1-.37 1.75v1.3h3.92l-.39 2.1-.29 1.57h-3.25v8.25C19.4 23.24 24 18.18 24 12.04c0-6.63-5.37-12-12-12S0 5.42 0 12.04c0 5.63 3.87 10.35 9.1 11.65Z" />
    </svg>
  );
}
