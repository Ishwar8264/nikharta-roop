"use client";

import { customerNavItems } from "../navigation.config";
import { NavLinkItem } from "./nav-link-item";

export function CustomerBottomNav() {
  return (
    <nav
      aria-label="Customer navigation"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-rose-100 bg-[#fffaf6]/95 px-2 pb-2 pt-1 shadow-[0_-10px_30px_rgba(120,53,15,0.08)] backdrop-blur md:hidden"
    >
      {customerNavItems.map((item) => (
        <NavLinkItem item={item} key={item.href} variant="bottom" />
      ))}
    </nav>
  );
}
