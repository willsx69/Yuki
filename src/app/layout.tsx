import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Yuki",
  title: {
    default: "Yuki — Controle de gastos",
    template: "%s · Yuki",
  },
  description:
    "Aplicação de controle de gastos. Nesta primeira etapa, apenas a estrutura e a interface visual.",
  appleWebApp: {
    capable: true,
    title: "Yuki",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "normal",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#16121f" },
  ],
  // Faz o navegador redimensionar o layout quando o teclado abre (formulários).
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
