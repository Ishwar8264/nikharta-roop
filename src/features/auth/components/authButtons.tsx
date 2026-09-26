import Link from "next/link";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";

/**
 * Sign-in / sign-up CTAs for the guest state.
 *
 * Why server component:
 * Pure render of two Links. No state, no events.
 *
 * Why `render` + `nativeButton={false}`:
 * Base UI's Button defaults to rendering a native <button>. When the render
 * prop returns a <Link> (which renders <a>), Base UI must be told explicitly
 * that the final element is not a button — otherwise it keeps button
 * semantics (space key, form submit) that don't apply to a link and warns.
 */
export function AuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <Button
        render={<Link href={routes.login} />}
        nativeButton={false}
        variant="ghost"
        size="sm"
      >
        Sign in
      </Button>
      <Button
        render={<Link href={routes.register} />}
        nativeButton={false}
        size="sm"
      >
        Sign up
      </Button>
    </div>
  );
}
