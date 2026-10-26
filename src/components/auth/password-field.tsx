"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "cn";

type PasswordFieldProps = {
  id?: string;
  name: string;
  label: string;
  autoComplete: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
};

/** Campo de senha com botão discreto para mostrar/ocultar. */
export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  placeholder,
  disabled,
  invalid,
  className,
}: PasswordFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative">
        <Input
          id={fieldId}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          {visible ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
        </button>
      </div>
    </div>
  );
}
