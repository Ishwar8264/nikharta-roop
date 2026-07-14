"use client";

// Load the reusable installed dropdown components for accessible theme selection.
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
// Load distinct icons so every theme mode is recognizable at a glance.
import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";
// Load the theme hook to read and update the saved user preference.
import { useTheme } from "next-themes";
// Load React's external-store helper for hydration-safe client detection.
import { useSyncExternalStore } from "react";

// Keep theme option labels, values, and icons in one reusable configuration.
const THEME_OPTIONS = [
  // Represent the explicit light color preference.
  { icon: Sun, label: "Light", value: "light" },
  // Represent the explicit dark color preference.
  { icon: Moon, label: "Dark", value: "dark" },
  // Represent the operating system color preference.
  { icon: Monitor, label: "System", value: "system" },
] as const;

// Provide a no-op subscription because hydration status has no external events.
const subscribeToHydration = () => {
  // Return an empty cleanup function required by the subscription contract.
  return () => undefined;
};

// Render a compact global dropdown for light, dark, and system themes.
export function ThemeToggle() {
  // Read the saved theme and setter from the nearest root theme provider.
  const { setTheme, theme } = useTheme();
  // Return false on the server and true after hydration without an effect state update.
  const isMounted = useSyncExternalStore(
    subscribeToHydration,
    // Report the mounted snapshot when React runs in the browser.
    () => true,
    // Report the server snapshot so the initial HTML stays deterministic.
    () => false,
  );
  // Use System during SSR, then use the saved preference after hydration.
  const selectedTheme = isMounted ? (theme ?? "system") : "system";
  // Find the selected option metadata without duplicating it in component state.
  const selectedOption =
    THEME_OPTIONS.find((option) => option.value === selectedTheme) ??
    THEME_OPTIONS[2];
  // Use the selected option's Lucide icon inside the dropdown trigger.
  const SelectedThemeIcon = selectedOption.icon;

  // Render the globally positioned theme dropdown.
  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Manage accessible open state and keyboard behavior through Radix. */}
      <DropdownMenu>
        {/* Render the theme-aware trigger as the interactive dropdown button. */}
        <DropdownMenuTrigger asChild disabled={!isMounted}>
          {/* Show the current mode while keeping a clear accessible label. */}
          <button
            aria-label="Choose theme"
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
          >
            {/* Reflect the currently selected theme with its matching icon. */}
            <SelectedThemeIcon aria-hidden="true" className="size-4" />
            {/* Display the selected mode for clear visual feedback. */}
            <span>{selectedOption.label}</span>
            {/* Indicate that the button opens a list of additional choices. */}
            <ChevronDown
              aria-hidden="true"
              className="size-3.5 text-muted-foreground"
            />
          </button>
        </DropdownMenuTrigger>
        {/* Align the floating menu with the trigger's right edge. */}
        <DropdownMenuContent align="end">
          {/* Persist the newly selected mode through next-themes. */}
          <DropdownMenuRadioGroup
            onValueChange={setTheme}
            value={selectedTheme}
          >
            {/* Render each supported theme from the single option configuration. */}
            {THEME_OPTIONS.map((option) => {
              // Keep the option icon component available for this menu row.
              const OptionIcon = option.icon;

              // Render one accessible and mutually exclusive theme choice.
              return (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {/* Pair every label with its corresponding Lucide icon. */}
                  <OptionIcon aria-hidden="true" className="size-4" />
                  {/* Show the human-readable theme name. */}
                  <span>{option.label}</span>
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
