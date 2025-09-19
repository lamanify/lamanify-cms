import * as React from "react";
import InputMask from "react-input-mask";
import { cn } from "@/lib/utils";

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: string) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, ...props }, ref) => {
    return (
      <InputMask
        mask="(999) 999-9999"
        maskChar=" "
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      >
        {(inputProps: any) => (
          <input
            {...inputProps}
            ref={ref}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary hover:border-primary transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              className
            )}
          />
        )}
      </InputMask>
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };