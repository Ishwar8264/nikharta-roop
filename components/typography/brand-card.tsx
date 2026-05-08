import * as React from "react";

export function BrandCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-3xl border border-stone-200 bg-white/60 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/40 ${className}`}
    >
      {children}
    </div>
  );
}
