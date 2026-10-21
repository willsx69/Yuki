import { cn } from "cn";
import Image from "next/image";

/** Marca do Yuki (logo oficial em public/yuki-logo.svg). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg",
        className,
      )}
    >
      <Image
        src="/yuki-logo.svg"
        alt="Yuki"
        width={32}
        height={32}
        className="size-full object-contain"
      />
    </span>
  );
}
