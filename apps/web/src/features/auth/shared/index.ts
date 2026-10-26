/**
 * Barrel for shared auth pieces.
 *
 * Why a barrel:
 * Consumers import from `@/features/auth/shared` without chasing individual
 * files. Internal reshuffles stay invisible to the rest of the app.
 *
 * Note: no "use client" — each export carries its own directive, and
 * Next.js honours it at the import site.
 */

export * from "./constants";
export * from "./schemas";
export * from "./types";

export { Field } from "./components/field";
export { FormError } from "./components/form-error";
export { FormSuccess } from "./components/form-success";
export { PasswordField } from "./components/password-field";
