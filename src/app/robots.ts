import type { MetadataRoute } from "next";

/**
 * La demo publica no tenia robots.txt: la peticion caia en la pagina y devolvia
 * HTML, que un rastreador lee como "no hay reglas" pero deja la URL del sitemap
 * sin declarar en ningun sitio.
 *
 * `NEXT_PUBLIC_SITE_URL` para que quien despliegue su copia apunte al suyo.
 */
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ui.violettadev.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
