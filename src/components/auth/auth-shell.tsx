import { LogoMark } from "@/components/layout/logo-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "cn";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

/** Layout centralizado das páginas públicas (login, cadastro etc.). */
export function AuthShell({ title, description, children, footer, className }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className={cn("w-full max-w-md", className)}>
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <LogoMark className="size-12" />
          <div>
            <p className="text-sm font-semibold tracking-tight text-primary">Yuki</p>
            <p className="text-xs text-muted-foreground">Controle de gastos pessoal</p>
          </div>
        </div>

        <Card className="border-border/70 shadow-[0_18px_45px_-24px_rgba(76,29,149,0.35)]">
          <CardHeader className="space-y-1.5 pb-4">
            <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">{children}</CardContent>
        </Card>

        {footer ? (
          <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
