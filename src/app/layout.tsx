import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CORE BRIM TECH OS",
  description: "The internal operating system for Core Brim Tech",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans bg-neutral-950 text-neutral-100 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
