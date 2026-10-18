import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  backHref?: string | null;
  backLabel?: string;
  className?: string;
}

/**
 * Displays a consistent placeholder while a product area is being prepared.
 *
 * Why:
 * Unfinished routes should feel intentional and give users a safe way back
 * instead of ending at an empty screen or a 404 page.
 */
export function ComingSoon({
  title,
  description,
  icon: Icon = Sparkles,
  backHref = routes.home,
  backLabel = "Back to home",
  className,
}: ComingSoonProps) {
  return (
    <section
      aria-labelledby="coming-soon-title"
      className={cn(
        "relative isolate flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-6 py-16",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute -top-24 left-1/2 -z-10 size-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute right-0 bottom-0 -z-10 size-64 rounded-full bg-accent/10 blur-3xl"
      />

      <Card className="w-full max-w-xl border border-border/70 bg-card/90 text-center shadow-2xl shadow-primary/5 backdrop-blur">
        <CardHeader className="items-center gap-4 px-6 pt-8 sm:px-10 sm:pt-10">
          <div className="relative grid size-20 place-items-center border border-primary/20 bg-primary/10 text-primary">
            <Icon aria-hidden="true" className="size-9" strokeWidth={1.7} />
            <Sparkles
              aria-hidden="true"
              className="absolute -top-2 -right-2 size-6 text-accent"
              strokeWidth={1.7}
            />
          </div>

          <Badge variant="secondary" className="uppercase tracking-[0.18em]">
            Coming soon
          </Badge>

          <div className="space-y-3">
            <CardTitle
              id="coming-soon-title"
              className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
            >
              {title}
            </CardTitle>
            <CardDescription className="mx-auto max-w-md text-base leading-7">
              {description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-8 sm:px-10 sm:pb-10">
          <p className="mb-6 text-sm text-muted-foreground">
            We&apos;re adding the final touches. Thank you for your patience.
          </p>
          {backHref ? (
            <Button
              variant="outline"
              render={<Link href={backHref} />}
              >
              <ArrowLeft aria-hidden="true" data-icon="inline-start" />
              {backLabel}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
