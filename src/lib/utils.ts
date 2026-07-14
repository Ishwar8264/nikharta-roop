// Load clsx to normalize conditional class name inputs.
import { clsx, type ClassValue } from "clsx";
// Load Tailwind Merge to resolve conflicting utility classes predictably.
import { twMerge } from "tailwind-merge";

// Combine conditional classes while keeping the caller's final Tailwind override.
export function cn(...inputs: ClassValue[]) {
  // Normalize the inputs first, then remove conflicting Tailwind declarations.
  return twMerge(clsx(inputs));
}
