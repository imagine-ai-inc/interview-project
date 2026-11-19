import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { DM_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { MotionProvider } from "@/components/layout/motion-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { tokensToCss } from "@/styles/tokens";

import "@/styles/globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const tokenCss = tokensToCss();

export const metadata: Metadata = {
  title: "Imagine Agent",
  description: "A simplified Imagine v2 agent chat",
};

/** v2's document. Theme is `data-theme`; tokens are inlined as CSS variables. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} h-full overscroll-none antialiased`}
      suppressHydrationWarning
    >
      <head>
        <style
          data-imagine-tokens=""
          dangerouslySetInnerHTML={{ __html: tokenCss }}
        />
      </head>
      <body className="flex min-h-full min-w-0 flex-col overflow-x-clip overscroll-none">
        <ThemeProvider
          attribute="data-theme"
          storageKey="imagine-theme"
          enableSystem
          disableTransitionOnChange
        >
          <MotionProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
