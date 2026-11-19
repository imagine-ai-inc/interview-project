import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ImagineAI Content Pipeline",
  description: "Prototype B2B social & outbound content generation pipeline",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-imagine-background text-imagine-foreground">
        {children}
      </body>
    </html>
  );
}
