// Load focused icons used by the server-rendered public discovery cards.
import {
  BookOpenText,
  Gift,
  Images,
  MapPin,
  Scissors,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";
// Load the shared icon contract for strict declarative landing-page content.
import type { LucideIcon } from "lucide-react";

// Describe one public destination introduced on the discovery landing page.
export type ExploreItem = {
  // Explain what a visitor can discover before following the destination.
  description: string;
  // Link directly to one schema-backed public route.
  href: string;
  // Pair the destination with one recognizable decorative icon.
  icon: LucideIcon;
  // Add an optional local visual only where photography improves visitor understanding.
  image?: {
    // Describe the meaningful photograph for screen-reader users.
    alt: string;
    // Reference one optimized project-local image without remote runtime dependencies.
    src: string;
  };
  // Keep the card action short and specific.
  linkLabel: string;
  // Display the customer-facing product area name.
  title: string;
};

// Describe one step in the salon discovery and appointment journey.
export type JourneyStep = {
  // Explain the visitor decision supported by this step.
  description: string;
  // Show a stable sequence without relying on client state.
  number: string;
  // Give the step one direct action-oriented heading.
  title: string;
};

// Keep every schema-backed public destination in one server-safe content catalog.
export const EXPLORE_ITEMS: readonly ExploreItem[] = [
  // Introduce bookable treatments and their service categories first.
  {
    description:
      "Discover hair, skin, makeup, grooming, and self-care options designed for different needs.",
    href: "/services",
    icon: Scissors,
    image: {
      alt: "A salon professional consulting with a client about her hair",
      src: "/images/home/service-consultation.jpg",
    },
    linkLabel: "Explore services",
    title: "Services",
  },
  // Help visitors find practical branch details before planning a visit.
  {
    description:
      "Compare salon locations, opening hours, contact details, and the services available nearby.",
    href: "/branches",
    icon: MapPin,
    image: {
      alt: "A warm modern salon interior with styling stations and mirrors",
      src: "/images/home/salon-interior.jpg",
    },
    linkLabel: "Find a branch",
    title: "Branches",
  },
  // Surface valid promotions without inventing an offer on the landing page.
  {
    description:
      "Browse current salon offers and understand where and when each benefit applies.",
    href: "/offers",
    icon: Gift,
    linkLabel: "View offers",
    title: "Offers",
  },
  // Let real salon work communicate expected style and craft visually.
  {
    description:
      "See before-and-after transformations and find inspiration for your next salon visit.",
    href: "/portfolio",
    icon: Images,
    image: {
      alt: "An Indian bridal salon look with refined makeup and styled hair",
      src: "/images/home/bridal-portfolio.jpg",
    },
    linkLabel: "View portfolio",
    title: "Portfolio",
  },
  // Introduce salon professionals separately from their private staff workspace.
  {
    description:
      "Meet salon professionals, explore their specializations, and find the right expertise for you.",
    href: "/team",
    icon: UsersRound,
    image: {
      alt: "A welcoming team of Indian salon professionals",
      src: "/images/home/salon-team.jpg",
    },
    linkLabel: "Meet the team",
    title: "Our Team",
  },
  // Use approved booking-linked feedback as a visitor trust signal.
  {
    description:
      "Read approved customer experiences and verified feedback before making your choice.",
    href: "/reviews",
    icon: Star,
    linkLabel: "Read reviews",
    title: "Reviews",
  },
  // Give visitors useful care guidance beyond the appointment journey.
  {
    description:
      "Explore practical hair, skin, beauty, and grooming guidance from the salon journal.",
    href: "/blogs",
    icon: BookOpenText,
    linkLabel: "Read the journal",
    title: "Beauty Journal",
  },
];

// Keep the discovery journey concise and consistent across responsive layouts.
export const JOURNEY_STEPS: readonly JourneyStep[] = [
  // Start with the visitor's treatment and style intent.
  {
    description:
      "Browse treatments, inspiration, and current offers without needing an account.",
    number: "01",
    title: "Discover what feels right",
  },
  // Bring location and professional context into the decision next.
  {
    description:
      "Compare branches and salon professionals based on the experience you need.",
    number: "02",
    title: "Choose your salon experience",
  },
  // Reserve account features for the final personalized stage.
  {
    description:
      "Sign in to keep bookings, favorites, payments, reviews, and updates together.",
    number: "03",
    title: "Manage your salon journey",
  },
];

// Keep the hero's service vocabulary compact and free from unsupported pricing claims.
export const CARE_AREAS = [
  // Highlight the most common salon discovery category.
  { icon: Scissors, label: "Hair" },
  // Include skin care as a distinct visitor intent.
  { icon: Sparkles, label: "Skin" },
  // Include occasion and everyday makeup discovery.
  { icon: Star, label: "Makeup" },
  // Include complete grooming and self-care exploration.
  { icon: Gift, label: "Grooming" },
] as const satisfies readonly { icon: LucideIcon; label: string }[];
