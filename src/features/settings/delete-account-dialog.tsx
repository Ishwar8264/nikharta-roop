"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/features/auth/shared/components/form-error";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/backend.client";

import { deleteAccountApi } from "./api";

/**
 * Danger-zone card with a confirm dialog gated on the current password.
 *
 * Why a two-step gate (button → dialog → password):
 * Account deletion is irreversible. A single misclick on a primary button
 * would be catastrophic, so the surface presents a quiet destructive button
 * that opens a dialog. Inside the dialog, the user must type their current
 * password — a stolen access token alone is not enough to destroy the
 * account, mirroring the server-side second-factor check.
 *
 * Why we redirect to `/login` on success:
 * The DELETE route clears session cookies. The next request to a protected
 * route would redirect to `/login` anyway; doing it explicitly avoids a
 * 401-flash on the dashboard.
 */
export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  function openDialog() {
    setFormMessage(null);
    setPassword("");
    setOpen(true);
  }

  async function handleConfirm() {
    if (!password) {
      setFormMessage("Enter your password to confirm.");
      return;
    }
    setBusy(true);
    setFormMessage(null);
    try {
      await deleteAccountApi({ password });
      toast.success("Your account has been deleted.");
      setOpen(false);
      // Hard navigation so the layout re-evaluates the session cookie.
      window.location.href = routes.login;
    } catch (error) {
      if (error instanceof ApiError) {
        setFormMessage(error.message);
      } else {
        setFormMessage("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Delete account
        </CardTitle>
        <CardDescription>
          Permanently remove your account, bookings, and personal data. This
          cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="destructive" onClick={openDialog}>
          Delete my account
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account permanently?</DialogTitle>
            <DialogDescription>
              This wipes your profile, sign-in sessions, and access to your
              booking history. Salons may keep records required for tax and
              audit purposes. Type your current password to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="delete-account-password">Current password</Label>
              <Input
                id="delete-account-password"
                type="password"
                autoComplete="current-password"
                placeholder="Your current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                aria-describedby="delete-account-password-error"
              />
            </div>
            <FormError>{formMessage}</FormError>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={busy || !password}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
