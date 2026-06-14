import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoreBrimTech OS — The Operating System for Startup Founders",
  description: "Research, build, track money, and grow your startup. All in one dashboard. Built for founders who move fast.",
  keywords: ["startup", "founder tools", "operating system", "dashboard", "SaaS"],
  openGraph: {
    title: "CoreBrimTech OS",
    description: "The operating system for startup founders. Research, build, track money, grow.",
    type: "website",
  },
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
