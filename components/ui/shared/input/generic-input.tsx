"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, AlertCircle, CircleCheck } from "lucide-react";

export interface InputFieldProps extends React.ComponentProps<"input"> {
  // Label Props
  label?: string;
  labelClassName?: string;
  showRequiredIndicator?: boolean;
  requiredIndicator?: React.ReactNode;
  hideLabel?: boolean;

  // Validation Props
  error?: string;
  success?: string;
  helperText?: string;

  // Icon Props
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftIconClassName?: string;
  rightIconClassName?: string;

  // Password Toggle Props
  showPasswordToggle?: boolean;
  passwordToggleClassName?: string;
  customPasswordIcons?: {
    show?: React.ReactNode;
    hide?: React.ReactNode;
  };

  // Status Icons Props
  showErrorIcon?: boolean;
  showSuccessIcon?: boolean;
  customErrorIcon?: React.ReactNode;
  customSuccessIcon?: React.ReactNode;
  errorIconClassName?: string;
  successIconClassName?: string;

  // Container Props
  containerClassName?: string;
  inputContainerClassName?: string;
  helperTextClassName?: string;
  rightIconsContainerClassName?: string;

  // Input Props
  inputClassName?: string;

  // Behavior Props
  required?: boolean;
  disabled?: boolean;
  onPasswordToggle?: (isVisible: boolean) => void;
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      // Label Props
      label,
      labelClassName,
      showRequiredIndicator = true,
      requiredIndicator,
      hideLabel = false,

      // Validation Props
      error,
      success,
      helperText,

      // Icon Props
      leftIcon,
      rightIcon,
      leftIconClassName,
      rightIconClassName,

      // Password Toggle Props
      showPasswordToggle,
      passwordToggleClassName,
      customPasswordIcons,
      onPasswordToggle,

      // Status Icons Props
      showErrorIcon = true,
      showSuccessIcon = true,
      customErrorIcon,
      customSuccessIcon,
      errorIconClassName,
      successIconClassName,

      // Container Props
      containerClassName,
      inputContainerClassName,
      helperTextClassName,
      rightIconsContainerClassName,

      // Input Props
      inputClassName,
      className, // Alias for inputClassName

      // Standard Props
      required,
      disabled,
      type,
      id,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    // call useId unconditionally (React Hook rules)
    const generatedId = React.useId();

    // Then use it conditionally
    const inputId = id || generatedId;

    // Determine input type
    const inputType = type === "password" && showPassword ? "text" : type;

    // Handle password toggle
    const handlePasswordToggle = () => {
      const newState = !showPassword;
      setShowPassword(newState);
      onPasswordToggle?.(newState);
    };

    // Determine if we should show right icons
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success);
    const shouldShowErrorIcon = hasError && showErrorIcon;
    const shouldShowSuccessIcon = hasSuccess && showSuccessIcon && !hasError;
    const shouldShowPasswordToggle =
      showPasswordToggle && type === "password" && !hasError && !hasSuccess;
    const shouldShowRightIcon =
      rightIcon && !showPasswordToggle && !hasError && !hasSuccess;

    const hasRightContent =
      shouldShowErrorIcon ||
      shouldShowSuccessIcon ||
      shouldShowPasswordToggle ||
      shouldShowRightIcon;

    return (
      <div className={cn("w-full space-y-1.5", containerClassName)}>
        {/* Label */}
        {label && !hideLabel && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium transition-colors",
              disabled && "opacity-50 cursor-not-allowed",
              hasError && "text-destructive",
              labelClassName,
            )}
          >
            {label}
            {required && showRequiredIndicator && (
              <>
                {requiredIndicator || (
                  <span className="text-destructive ml-1">*</span>
                )}
              </>
            )}
          </label>
        )}

        {/* Input Container */}
        <div className={cn("relative", inputContainerClassName)}>
          {/* Left Icon */}
          {leftIcon && (
            <div
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none",
                disabled ? "opacity-50" : "text-muted-foreground",
                leftIconClassName,
              )}
            >
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <Input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled}
            required={required}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={
              error || success || helperText
                ? `${inputId}-description`
                : undefined
            }
            className={cn(
              // Icon padding
              leftIcon && "pl-10",
              hasRightContent && "pr-10",

              // Validation states
              hasError &&
                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
              hasSuccess &&
                "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/20",

              // Custom className (inputClassName takes precedence)
              inputClassName || className,
            )}
            {...props}
          />

          {/* Right Icons Container */}
          {hasRightContent && (
            <div
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5",
                rightIconsContainerClassName,
              )}
            >
              {/* Error Icon */}
              {shouldShowErrorIcon && (
                <div className={cn("shrink-0", errorIconClassName)}>
                  {customErrorIcon || (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              )}

              {/* Success Icon */}
              {shouldShowSuccessIcon && (
                <div className={cn("shrink-0", successIconClassName)}>
                  {customSuccessIcon || (
                    <CircleCheck className="h-4 w-4 text-green-500" />
                  )}
                </div>
              )}

              {/* Password Toggle */}
              {shouldShowPasswordToggle && (
                <button
                  type="button"
                  onClick={handlePasswordToggle}
                  disabled={disabled}
                  className={cn(
                    "shrink-0 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    passwordToggleClassName,
                  )}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? customPasswordIcons?.hide || (
                        <EyeOff className="h-4 w-4" />
                      )
                    : customPasswordIcons?.show || <Eye className="h-4 w-4" />}
                </button>
              )}

              {/* Custom Right Icon */}
              {shouldShowRightIcon && (
                <div
                  className={cn(
                    "shrink-0 text-muted-foreground",
                    rightIconClassName,
                  )}
                >
                  {rightIcon}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Helper/Error/Success Text */}
        {(error || success || helperText) && (
          <p
            id={`${inputId}-description`}
            className={cn(
              "text-xs transition-colors",
              hasError && "text-destructive",
              hasSuccess && "text-green-600 dark:text-green-500",
              !hasError && !hasSuccess && "text-muted-foreground",
              helperTextClassName,
            )}
          >
            {error || success || helperText}
          </p>
        )}
      </div>
    );
  },
);

InputField.displayName = "InputField";

export { InputField };
