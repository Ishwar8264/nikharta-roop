"use client";

import * as React from "react";
import {
  showSuccess,
  showError,
  showInfo,
} from "@/components/ui/shared/toast/custom-toast";
import { Button } from "@/components/ui/button";

export function TestComponent() {
  return (
    <div className="flex gap-2">
      <Button
        onClick={() =>
          showSuccess("Login Successful", "Welcome back to Nikharta!")
        }
      >
        Success
      </Button>

      <Button
        variant="destructive"
        onClick={() =>
          showError("Login Failed", "Invalid mobile number or OTP.")
        }
      >
        Error
      </Button>

      <Button
        onClick={() =>
          showInfo("OTP Sent", "Check your messages for the 6-digit code.")
        }
      >
        Info
      </Button>
    </div>
  );
}
