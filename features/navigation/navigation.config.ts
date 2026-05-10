import {
  BadgeIndianRupee,
  Bell,
  BookOpenText,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  CreditCard,
  Gift,
  HeartHandshake,
  Home,
  Images,
  LayoutDashboard,
  MapPin,
  Package,
  PackageCheck,
  ReceiptIndianRupee,
  RotateCcw,
  Scissors,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  UserCog,
  Users,
  WalletCards,
  Warehouse,
} from "lucide-react";

import type { NavItem, NavSection } from "./navigation.types";

export const publicNavItems: NavItem[] = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/services", icon: Scissors, label: "Services" },
  { href: "/packages", icon: Package, label: "Packages" },
  { href: "/portfolio", icon: Images, label: "Portfolio" },
  { href: "/offers", icon: Gift, label: "Offers" },
  { href: "/blogs", icon: BookOpenText, label: "Blogs" },
  { href: "/branches", icon: MapPin, label: "Branches" },
];

export const customerNavItems: NavItem[] = [
  { href: "/account", icon: Home, label: "Home" },
  { href: "/account/book", icon: Sparkles, label: "Book" },
  { href: "/account/bookings", icon: CalendarDays, label: "Bookings" },
  { href: "/account/offers", icon: Gift, label: "Offers" },
  { href: "/account/profile", icon: Users, label: "Profile" },
];

export const adminNavSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/admin/reports", icon: ChartNoAxesCombined, label: "Reports" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/bookings", icon: CalendarDays, label: "Bookings" },
      { href: "/admin/consultations", icon: HeartHandshake, label: "Consultations" },
      { href: "/admin/branches", icon: Store, label: "Branches" },
      { href: "/admin/staff", icon: UserCog, label: "Staff" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/services", icon: Scissors, label: "Services" },
      { href: "/admin/packages", icon: PackageCheck, label: "Packages" },
      { href: "/admin/offers", icon: Gift, label: "Offers" },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/admin/users", icon: Users, label: "Customers" },
      { href: "/admin/reviews", icon: Star, label: "Reviews" },
      { href: "/admin/loyalty", icon: WalletCards, label: "Loyalty" },
      { href: "/admin/notifications", icon: Bell, label: "Notifications" },
    ],
  },
  {
    label: "Sales & Finance",
    items: [
      { href: "/admin/payments", icon: CreditCard, label: "Payments" },
      { href: "/admin/refunds", icon: RotateCcw, label: "Refunds" },
      { href: "/admin/product-sales", icon: ShoppingBag, label: "Product Sales" },
      { href: "/admin/expenses", icon: ReceiptIndianRupee, label: "Expenses" },
      {
        href: "/admin/staff-commissions",
        icon: BadgeIndianRupee,
        label: "Staff Commissions",
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      { href: "/admin/products", icon: ShoppingBag, label: "Products" },
      { href: "/admin/inventory", icon: Warehouse, label: "Inventory" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/portfolio", icon: Images, label: "Portfolio" },
      { href: "/admin/blogs", icon: BookOpenText, label: "Blogs" },
      { href: "/admin/media", icon: ClipboardList, label: "Media" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/auth-events", icon: ShieldCheck, label: "Auth Events" },
      { href: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];
