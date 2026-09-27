"use client";

import {
  Calendar,
  Gift,
  Heart,
  Home,
  Info,
  Notebook,
  Scissors,
  Settings,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";

import type { NavIconName } from "./nav.types";

/**
 * Maps serializable icon names to Lucide components.
 *
 * Why this file exists:
 * React components cannot cross the server→client boundary. Server-rendered
 * nav surfaces pass only a string name; the client component looks up the
 * real component here. Keeping the map in a client-only module means Lucide
 * never enters the server bundle for this path.
 *
 * The `satisfies Record<NavIconName, LucideIcon>` clause is the contract:
 * adding a new name to `NavIconName` without adding it here is a compile
 * error, so the union and the map can never drift.
 */
export const navIconMap = {
  home: Home,
  scissors: Scissors,
  sparkles: Sparkles,
  notebook: Notebook,
  info: Info,
  calendar: Calendar,
  heart: Heart,
  gift: Gift,
  user: User,
  settings: Settings,
} satisfies Record<NavIconName, LucideIcon>;
