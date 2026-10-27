import {
  Award,
  BadgeCheck,
  CalendarCheck,
  CreditCard,
  Gift,
  HeadphonesIcon,
  Scissors,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

/**
 * Homepage content — single source of truth.
 *
 * Why a config file instead of inline JSX:
 * Copy changes are 80% of homepage edits, and a copy change should never
 * require touching layout code. Keeping the strings, icons, and links here
 * also makes it trivial to swap in a CMS/API later — the section components
 * stay pure renderers.
 *
 * All arrays are `as const` so the literal types survive into the components.
 */

// ─────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────

export const hero = {
  eyebrow: "Beauty, made effortless",
  headline: "Your best look starts with the right salon.",
  subheadline:
    "Discover trusted salons, explore services, and book your perfect appointment—all in a few effortless taps.",
  primaryCta: { label: "Explore salons", href: "/salons" },
  secondaryCta: { label: "How it works", href: "#how-it-works" },
  image: {
    src: "/brand/home/hero-salon.jpg",
    alt: "Stylist caring for a client in a bright premium salon",
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Trust stats — displayed as a row under the hero
// ─────────────────────────────────────────────────────────────

export const trustStats = [
  { value: "500+", label: "Verified salons" },
  { value: "50K+", label: "Bookings completed" },
  { value: "4.8", label: "Average rating", showStar: true },
  { value: "12", label: "Cities live" },
] as const;

// ─────────────────────────────────────────────────────────────
// Service categories
// ─────────────────────────────────────────────────────────────

export const serviceCategories = [
  {
    slug: "hair",
    name: "Hair",
    description: "Cuts, color, styling & treatments",
    icon: Scissors,
  },
  {
    slug: "skin",
    name: "Skin",
    description: "Facials, cleanups & dermat care",
    icon: Sparkles,
  },
  {
    slug: "nails",
    name: "Nails",
    description: "Manicures, pedicures & extensions",
    icon: Award,
  },
  {
    slug: "beard",
    name: "Beard & Grooming",
    description: "Shaves, trims & beard styling",
    icon: Users,
  },
  {
    slug: "spa",
    name: "Spa & Massage",
    description: "Body therapies & relaxation",
    icon: TrendingUp,
  },
  {
    slug: "bridal",
    name: "Bridal",
    description: "Bridal packages & pre-wedding",
    icon: Star,
  },
] as const;

// ─────────────────────────────────────────────────────────────
// Featured salons — static for now, Prisma fetch later
// ─────────────────────────────────────────────────────────────

export const featuredSalons = [
  {
    id: "s1",
    name: "Élan Studio",
    slug: "elan-studio",
    city: "Mumbai",
    rating: 4.9,
    reviewCount: 214,
    priceFrom: 599,
    image: "/brand/home/salon-elan.jpg",
    category: "Unisex",
  },
  {
    id: "s2",
    name: "Aura Beauty Lounge",
    slug: "aura-beauty-lounge",
    city: "Bangalore",
    rating: 4.8,
    reviewCount: 178,
    priceFrom: 449,
    image: "/brand/home/salon-aura.jpg",
    category: "Women",
  },
  {
    id: "s3",
    name: "The Gentleman's Room",
    slug: "gentlemans-room",
    city: "Delhi",
    rating: 4.9,
    reviewCount: 302,
    priceFrom: 399,
    image: "/brand/home/salon-gentleman.jpg",
    category: "Men",
  },
  {
    id: "s4",
    name: "Blush Beauty Bar",
    slug: "blush-beauty-bar",
    city: "Pune",
    rating: 4.7,
    reviewCount: 156,
    priceFrom: 549,
    image: "/brand/home/salon-blush.jpg",
    category: "Unisex",
  },
  {
    id: "s5",
    name: "Serene Spa & Salon",
    slug: "serene-spa-salon",
    city: "Hyderabad",
    rating: 4.8,
    reviewCount: 289,
    priceFrom: 699,
    image: "/brand/home/salon-serene.jpg",
    category: "Spa",
  },
  {
    id: "s6",
    name: "Studio Nine",
    slug: "studio-nine",
    city: "Chennai",
    rating: 4.9,
    reviewCount: 241,
    priceFrom: 649,
    image: "/brand/home/hero-salon.jpg",
    category: "Unisex",
  },
] as const;

// ─────────────────────────────────────────────────────────────
// How it works
// ─────────────────────────────────────────────────────────────

export const howItWorks = [
  {
    step: 1,
    title: "Search nearby",
    description:
      "Browse verified salons by city, service, or rating — all in one place.",
    icon: Search,
  },
  {
    step: 2,
    title: "Pick your slot",
    description:
      "See live availability, choose your stylist, and lock a time that works.",
    icon: CalendarCheck,
  },
  {
    step: 3,
    title: "Confirm & relax",
    description:
      "Pay securely or pay at the salon. Show up and enjoy the experience.",
    icon: CreditCard,
  },
] as const;

// ─────────────────────────────────────────────────────────────
// Why choose us
// ─────────────────────────────────────────────────────────────

export const whyChooseUs = [
  {
    title: "Verified salons only",
    description:
      "Every partner passes a quality and hygiene check before going live.",
    icon: BadgeCheck,
  },
  {
    title: "Instant confirmation",
    description:
      "No calls, no waiting. Your slot is locked the moment you book.",
    icon: CalendarCheck,
  },
  {
    title: "Secure payments",
    description:
      "UPI, cards, wallets, or cash at the salon — your choice, always encrypted.",
    icon: CreditCard,
  },
  {
    title: "Loyalty rewards",
    description:
      "Earn points on every booking and redeem them on your next visit.",
    icon: Gift,
  },
  {
    title: "AI assistant",
    description:
      "Not sure what you need? Describe the look and get personal recommendations.",
    icon: Sparkles,
  },
  {
    title: "Real support",
    description:
      "Humans on chat, email, and phone — whenever something needs fixing.",
    icon: HeadphonesIcon,
  },
] as const;

// ─────────────────────────────────────────────────────────────
// Testimonials
// ─────────────────────────────────────────────────────────────

export const testimonials = [
  {
    id: "t1",
    name: "Ananya R.",
    city: "Mumbai",
    rating: 5,
    quote:
      "Booked a bridal package three months in advance. The stylist was exactly who I picked, the timing was on the dot, and the pricing had zero surprises.",
  },
  {
    id: "t2",
    name: "Karan M.",
    city: "Bangalore",
    rating: 5,
    quote:
      "I've used three different salon apps. This is the first one where the slot I booked was actually the slot I got. That alone makes it my default.",
  },
  {
    id: "t3",
    name: "Priya S.",
    city: "Delhi",
    rating: 5,
    quote:
      "The loyalty points are genuinely useful — I've redeemed two full services already. Plus the AI recommendations nailed my hair type on the first try.",
  },
] as const;

// ─────────────────────────────────────────────────────────────
// AI promo
// ─────────────────────────────────────────────────────────────

export const aiPromo = {
  eyebrow: "Nikharta AI",
  headline: "Not sure what suits you?",
  description:
    "Describe the look, occasion, or concern — our AI recommends salons, services, and stylists matched to you.",
  cta: { label: "Try the assistant", href: "/ai" },
} as const;

// ─────────────────────────────────────────────────────────────
// Final CTA
// ─────────────────────────────────────────────────────────────

export const finalCta = {
  headline: "Ready to look your best?",
  description:
    "Join thousands who book their salon visits in seconds — not over the phone.",
  primaryCta: { label: "Find a salon", href: "/salons" },
  secondaryCta: { label: "List your salon", href: "/contact" },
} as const;
