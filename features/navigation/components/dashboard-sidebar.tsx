"use client";

import Link from "next/link";

import { Logo } from "@/components/ui/shared/logo/logo";
import { adminNavSections } from "../navigation.config";
import { NavLinkItem } from "./nav-link-item";

export function DashboardSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-rose-100 bg-[#fffaf6] lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-rose-100 px-5">
        <Logo size="md" href="/admin" />
      </div>

      <div className="border-b border-rose-100 p-4">
        <Link
          href="/admin/branches"
          className="block rounded-lg border border-rose-100 bg-white px-3 py-2.5 shadow-sm"
        >
          <span className="block text-xs font-medium uppercase tracking-wide text-stone-500">
            Active Branch
          </span>
          <span className="mt-1 block text-sm font-semibold text-stone-950">
            Nikharta Roop Studio
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-5" aria-label="Admin navigation">
        {adminNavSections.map((section) => (
          <section key={section.label}>
            <h2 className="px-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
              {section.label}
            </h2>
            <div className="mt-2 space-y-1">
              {section.items.map((item) => (
                <NavLinkItem item={item} key={item.href} />
              ))}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}
