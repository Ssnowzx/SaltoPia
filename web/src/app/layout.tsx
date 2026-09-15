import type { Metadata } from "next";
import { Figtree, Yellowtail } from "next/font/google";

import "./globals.css";

/**
 * Figtree stands in for the reference implementation's Proxima Nova: a
 * geometric-humanist sans with a 400-900 range, so the heavy display weights the
 * layout depends on actually exist. See design.md D5.
 */
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  display: "swap",
});

/**
 * Yellowtail stands in for Cinema Script: the same retro sign-painter register.
 * Decorative use only - never body text, never below 20px.
 */
const yellowtail = Yellowtail({
  variable: "--font-yellowtail",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Saltopia",
    template: "%s | Saltopia",
  },
  description: "Salto Caveiras · Serra Catarinense. A comunidade do Salto do Rio Caveiras, em Lages.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${figtree.variable} ${yellowtail.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
