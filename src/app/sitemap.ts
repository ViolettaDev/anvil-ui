import type { MetadataRoute } from "next";

/**
 * Una sola pagina, pero declarada: es lo que le dice a un buscador que existe
 * sin esperar a que alguien la enlace.
 */
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ui.violettadev.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
