import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anvil UI — React primitives for Next.js 16 + Tailwind v4",
  description:
    "Accessible, themeable React primitives. Date, range and time pickers written by hand, with no calendar dependency. MIT.",
};

/**
 * Applies the stored theme BEFORE first paint, so a dark-mode visitor never
 * sees a white flash.
 *
 * This has to be a plain server-rendered <script> with dangerouslySetInnerHTML.
 * React 19 warns about client-rendered <script>, and next/script always runs too
 * late for this — by the time it executes the page has already painted.
 */
const themeBoot = `
(function () {
  try {
    var stored = localStorage.getItem("anvil-theme");
    if (stored === "dark" || stored === "light") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the boot script mutates this element before
    // React hydrates, which is the whole point of it.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
