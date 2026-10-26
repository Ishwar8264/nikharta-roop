import {
  Bell,
  BookOpenText,
  Bot,
  CalendarDays,
  CircleHelp,
  FileLock2,
  FileText,
  Gift,
  Heart,
  Info,
  Mail,
  Scissors,
  Settings,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface ComingSoonPageConfig {
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Content for every unfinished public and customer-facing route.
 *
 * Why:
 * Keeping placeholder copy in one typed map makes it easy to replace or
 * update a feature without letting route messages drift apart.
 */
export const comingSoonPages = {
  home: {
    title: "Something beautiful is taking shape",
    description:
      "Nikharta Roop is creating a simpler way to discover salons, book services, and enjoy personalised beauty experiences.",
    icon: Sparkles,
  },
  salons: {
    title: "Discover salons near you",
    description:
      "A curated salon directory with ratings, services, and easy booking is on its way.",
    icon: Scissors,
  },
  salonDetail: {
    title: "Salon details are taking shape",
    description:
      "Soon you will be able to explore services, artists, reviews, and availability in one place.",
    icon: Scissors,
  },
  salonBooking: {
    title: "Effortless booking is almost here",
    description:
      "We are preparing a smooth appointment flow so your next salon visit takes only a few taps.",
    icon: CalendarDays,
  },
  blog: {
    title: "Fresh beauty stories are coming",
    description:
      "Expert tips, inspiring trends, and thoughtful self-care guides will be published here soon.",
    icon: BookOpenText,
  },
  blogPost: {
    title: "This story is being polished",
    description:
      "Our editorial team is putting the finishing touches on content worth your time.",
    icon: BookOpenText,
  },
  about: {
    title: "Our story is unfolding",
    description:
      "We are preparing the story behind Nikharta Roop and the people bringing it to life.",
    icon: Info,
  },
  contact: {
    title: "A better way to reach us",
    description:
      "Our contact experience is almost ready. Soon, getting help will be simple and quick.",
    icon: Mail,
  },
  help: {
    title: "Help is on the way",
    description:
      "We are building clear answers and useful guides to make every visit effortless.",
    icon: CircleHelp,
  },
  privacy: {
    title: "Privacy information is coming soon",
    description:
      "We are preparing a clear explanation of how your information is handled and protected.",
    icon: FileLock2,
  },
  terms: {
    title: "Terms are being prepared",
    description:
      "Our terms of service will be available here shortly in a clear, easy-to-read format.",
    icon: FileText,
  },
  dashboard: {
    title: "Your beauty dashboard is almost ready",
    description:
      "Soon, your bookings, favourites, rewards, and personalised updates will come together here.",
    icon: Sparkles,
  },
  appointments: {
    title: "Appointments, beautifully organised",
    description:
      "Soon you will be able to view, manage, and keep track of every salon visit from here.",
    icon: CalendarDays,
  },
  appointmentDetail: {
    title: "Appointment details are coming",
    description:
      "Everything about your booking, from timing to service details, will appear here soon.",
    icon: CalendarDays,
  },
  favorites: {
    title: "Your favourites deserve a special place",
    description:
      "Save the salons and services you love, then find them again whenever inspiration strikes.",
    icon: Heart,
  },
  loyalty: {
    title: "Beautiful rewards are on the way",
    description:
      "Earn, track, and enjoy loyalty benefits designed to make every visit feel more rewarding.",
    icon: Gift,
  },
  ai: {
    title: "Your beauty assistant is getting ready",
    description:
      "Personalised suggestions and smarter salon discovery will be available here soon.",
    icon: Bot,
  },
  profile: {
    title: "Your profile is being prepared",
    description:
      "Soon you will be able to manage your personal details and beauty preferences here.",
    icon: UserRound,
  },
  settings: {
    title: "Your preferences, your way",
    description:
      "Account, privacy, and notification controls are being thoughtfully brought together.",
    icon: Settings,
  },
  notifications: {
    title: "Stay beautifully up to date",
    description:
      "Booking reminders, offers, and important account updates will appear here soon.",
    icon: Bell,
  },
} satisfies Record<string, ComingSoonPageConfig>;
