import Link from "next/link";

const items = [
  { href: "/", label: "होम" },
  { href: "/services", label: "सेवाएं" },
  { href: "/bookings", label: "बुकिंग" },
  { href: "/profile", label: "प्रोफाइल" },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background md:hidden">
      {items.map((item) => (
        <Link className="px-2 py-3 text-center text-xs font-medium" href={item.href} key={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
