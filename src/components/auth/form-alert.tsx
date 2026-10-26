import { AlertTriangle, Info } from "lucide-react";
import { cn } from "cn";

type FormAlertProps = {
  tone?: "error" | "info";
  children: React.ReactNode;
  className?: string;
};

/** Bloco de feedback de erro/informação dos formulários de autenticação. */
export function FormAlert({ tone = "error", children, className }: FormAlertProps) {
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm",
        isError
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-primary/25 bg-accent text-accent-foreground",
        className,
      )}
    >
      {isError ? (
        <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
      ) : (
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
      )}
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}

/** Lista curta de requisitos ainda não atendidos de um campo. */
export function FieldErrors({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null;
  return (
    <ul className="space-y-0.5 text-xs text-destructive">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}
