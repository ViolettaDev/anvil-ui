import type { Metadata } from "next";
import "./globals.css";

/**
 * `metadataBase` es lo que convierte las rutas relativas de abajo en absolutas.
 * Sin el, `canonical` y las imagenes de Open Graph salen como rutas sueltas y
 * ni Google ni quien comparte el enlace pueden resolverlas.
 *
 * Sale de una variable porque quien descarga el kit lo despliega en su dominio,
 * no en el nuestro: dejarlo fijo le regalaria un canonical apuntando aqui, que
 * es la forma mas rapida de que su propia pagina no se indexe.
 */
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ui.violettadev.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Anvil UI — free React date, range and time pickers for Next.js 16",
  description:
    "23 accessible React components for Next.js 16 and Tailwind v4. The date, range and time pickers are written by hand — no react-day-picker, no date-fns, no dayjs. MIT.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Anvil UI",
    title: "Anvil UI — free React date, range and time pickers for Next.js 16",
    description:
      "23 accessible React components styled entirely from CSS variables. Pickers written by hand, no calendar library. MIT.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anvil UI — free React pickers for Next.js 16",
    description: "Date, range and time pickers with no calendar dependency. MIT.",
  },
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
