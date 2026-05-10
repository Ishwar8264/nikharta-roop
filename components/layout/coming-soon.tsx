import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

type ComingSoonProps = {
  eyebrow?: string;
  icon?: LucideIcon;
  title: string;
};

export function ComingSoon({
  eyebrow = "Coming Soon",
  icon: Icon = Sparkles,
  title,
}: ComingSoonProps) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full rounded-lg border border-rose-100 bg-white p-6 shadow-sm shadow-rose-950/5 sm:p-8">
        <div className="flex size-11 items-center justify-center rounded-lg bg-rose-100 text-rose-900">
          <Icon className="size-5" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-rose-800">
          {eyebrow}
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
          This page is reserved for the Nikharta Roop workflow. Navigation is ready, and the module
          screens can now be built one by one without changing the route structure.
        </p>
      </div>
    </section>
  );
}
