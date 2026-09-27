"use client";

import IntlTelInput, {
  type IntlTelInputRef,
} from "@intl-tel-input/react";
import { forwardRef, useState } from "react";

import { cn } from "@/lib/utils";

type IntlTelInputProps = React.ComponentProps<typeof IntlTelInput>;
type NativeInputProps = NonNullable<IntlTelInputProps["inputProps"]>;

export interface PhoneInputProps
  extends Omit<
    IntlTelInputProps,
    | "disabled"
    | "inputProps"
    | "onChangeNumber"
    | "readOnly"
    | "ref"
    | "value"
  > {
  /** Canonical E.164 value when the component is controlled. */
  value?: string;
  /** Initial E.164 value when the component owns its state. */
  defaultValue?: string;
  /** Receives an E.164 number, or an empty string when cleared. */
  onValueChange?: (value: string) => void;
  /** Form field name. A hidden input submits the canonical E.164 value. */
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  inputClassName?: string;
  inputProps?: Omit<
    NativeInputProps,
    "className" | "defaultValue" | "disabled" | "name" | "readOnly" | "value"
  >;
}

/**
 * International phone control that always exposes a canonical E.164 value.
 *
 * Why:
 * Users should type familiar national numbers, while forms and APIs should
 * consistently receive one storage-safe representation. The hidden named
 * input keeps native FormData compatible without leaking display formatting
 * into request payloads.
 */
export const PhoneInput = forwardRef<IntlTelInputRef, PhoneInputProps>(
  function PhoneInput(
    {
      value,
      defaultValue = "",
      onValueChange,
      name,
      disabled,
      readOnly,
      className,
      inputClassName,
      inputProps,
      initialCountry = "in",
      loadUtils = () => import("intl-tel-input/utils"),
      separateDialCode = true,
      strictMode = true,
      ...props
    },
    ref,
  ) {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue);
    const currentValue = isControlled ? value : internalValue;

    function handleValueChange(nextValue: string) {
      if (!isControlled) setInternalValue(nextValue);
      onValueChange?.(nextValue);
    }

    return (
      <div className={cn("phone-input", className)}>
        <IntlTelInput
          {...props}
          ref={ref}
          value={currentValue}
          initialCountry={initialCountry}
          separateDialCode={separateDialCode}
          strictMode={strictMode}
          disabled={disabled}
          readOnly={readOnly}
          loadUtils={loadUtils}
          onChangeNumber={handleValueChange}
          inputProps={{
            ...inputProps,
            className: cn(
              "phone-input__control",
              "placeholder:text-muted-foreground/80",
              inputClassName,
            ),
          }}
        />

        {name ? (
          <input
            type="hidden"
            name={name}
            value={currentValue}
            form={inputProps?.form}
          />
        ) : null}
      </div>
    );
  },
);

PhoneInput.displayName = "PhoneInput";
