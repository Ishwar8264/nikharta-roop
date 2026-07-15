// Load the shared button so the account trigger follows existing interaction styles.
import { Button } from "@/src/components/ui/button";
// Load the reusable accessible dropdown pieces used by the account menu.
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
// Load focused icons that make each account action easy to scan.
import {
  ChevronDown,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";

// Render the private navigation account menu without attaching auth behavior yet.
export function UserMenu() {
  // Keep all account actions inside one keyboard-accessible dropdown.
  return (
    <DropdownMenu>
      {/* Use the shared button as the accessible menu trigger. */}
      <DropdownMenuTrigger asChild>
        {/* Show a compact account control that still has a clear screen-reader label. */}
        <Button
          aria-label="Open user menu"
          size="sm"
          type="button"
          variant="ghost"
        >
          {/* Use a neutral avatar icon until the authenticated user profile is wired. */}
          <span className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <UserRound aria-hidden="true" className="size-4" />
          </span>
          {/* Keep the trigger compact on smaller private screens. */}
          <span className="hidden xl:inline">Account</span>
          {/* Indicate that the account control opens additional options. */}
          <ChevronDown
            aria-hidden="true"
            className="hidden size-3.5 text-muted-foreground xl:block"
          />
        </Button>
      </DropdownMenuTrigger>

      {/* Align the account panel with the right edge of its trigger. */}
      <DropdownMenuContent align="end" className="w-52">
        {/* Identify the menu without showing invented user information. */}
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        {/* Separate account context from its available actions. */}
        <DropdownMenuSeparator />

        {/* Present the future profile destination as a UI-only menu action. */}
        <DropdownMenuItem>
          <UserRound aria-hidden="true" className="size-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        {/* Present account preferences without attaching a route prematurely. */}
        <DropdownMenuItem>
          <Settings aria-hidden="true" className="size-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        {/* Visually isolate the future session-ending action from regular navigation. */}
        <DropdownMenuSeparator />

        {/* Show the logout affordance without calling the pending logout endpoint. */}
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <LogOut aria-hidden="true" className="size-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
