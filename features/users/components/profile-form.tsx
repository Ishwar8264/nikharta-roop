"use client";

import * as React from "react";
import { Mail, Phone, UserRound } from "lucide-react";

import { InputField } from "@/components/ui/shared/input/generic-input";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import { updateProfileAction } from "@/features/users/actions/profile.actions";
import { ProfileSubmitButton } from "@/features/users/components/profile-submit-button";
import type { UserProfile } from "@/features/users/types/user-profile.types";

type ProfileFormProps = {
  branches: PublicBranch[];
  user: UserProfile;
};

const inputClassName = "h-11 rounded-xl bg-white";
const EMPTY_BRANCH_VALUE = "__none__";

// Client form keeps UX responsive while PATCH still goes through the API handler.
export function ProfileForm({ branches, user }: ProfileFormProps) {
  const [state, formAction] = React.useActionState(updateProfileAction, {
    message: "",
    success: false,
  });

  return (
    <form action={formAction} className="space-y-5">
      <InputField
        name="name"
        label="Name"
        defaultValue={user.name ?? ""}
        placeholder="Your name"
        leftIcon={<UserRound className="size-4" />}
        inputClassName={inputClassName}
      />
      <InputField
        name="email"
        label="Email"
        type="email"
        defaultValue={user.email ?? ""}
        placeholder="you@example.com"
        leftIcon={<Mail className="size-4" />}
        inputClassName={inputClassName}
      />
      <InputField
        label="Mobile Number"
        defaultValue={user.mobile}
        disabled
        leftIcon={<Phone className="size-4" />}
        inputClassName={inputClassName}
        helperText="Mobile number changes need OTP verification."
      />

      <BranchSelect branches={branches} value={user.branchId} />

      {state.message ? (
        <p
          className={state.success ? "text-sm text-green-700" : "text-sm text-destructive"}
        >
          {state.message}
        </p>
      ) : null}

      <ProfileSubmitButton />
    </form>
  );
}

function BranchSelect({
  branches,
  value,
}: {
  branches: PublicBranch[];
  value: string | null;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      Preferred Branch
      <select
        name="branchId"
        defaultValue={value ?? EMPTY_BRANCH_VALUE}
        className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
      >
        <option value={EMPTY_BRANCH_VALUE}>No branch selected</option>
        {branches.map((branch) => (
          <option value={branch.id} key={branch.id}>
            {branch.nameHi} - {branch.city}
          </option>
        ))}
      </select>
    </label>
  );
}
