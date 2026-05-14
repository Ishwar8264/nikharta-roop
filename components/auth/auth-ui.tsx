import * as React from "react";

import { Logo } from "@/components/ui/shared/logo/logo";
import { cn } from "@/lib/utils";

const authFormClassName =
  "w-full max-w-[430px] rounded-2xl border border-rose-100 bg-white/95 p-5 shadow-sm shadow-rose-100/60 sm:p-7";

const authInputClassName = "h-11 rounded-xl text-sm";
const authButtonClassName = "h-11 rounded-xl text-sm font-semibold";

function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
      {children}
    </section>
  );
}

function AuthFormHeader({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      <Logo size="md" />
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-stone-950">
          {title}
        </h2>
        <p className="text-sm leading-5 text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export {
  AuthFormHeader,
  AuthPageShell,
  authButtonClassName,
  authFormClassName,
  authInputClassName,
};
