import { ButtonLink } from "@/components/ui/Button";

/**
 * DemoGetKit — la unica llamada a la accion de la demo publica.
 *
 * La pagina ensenaba los 23 componentes y no decia en ningun sitio donde se
 * consiguen: quien llegaba, le gustaba y queria el codigo no tenia adonde ir.
 *
 * Va detras de `NEXT_PUBLIC_VS_DEMO`, igual que la barra de compra de los cinco
 * templates de pago y por la misma razon: quien descarga el kit se lleva este
 * fichero, y su copia no debe anunciar nuestra tienda. Como la variable solo
 * esta puesta en el sitio publico, para el que descarga esto no existe.
 *
 * Para borrarlo del todo: elimina este fichero y su uso en `src/app/page.tsx`.
 */
const GUMROAD = "https://violettastudio.gumroad.com/l/anvil";

export function DemoGetKit() {
  if (process.env.NEXT_PUBLIC_VS_DEMO !== "true") return null;

  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
      <ButtonLink href={GUMROAD} target="_blank" rel="noopener noreferrer">
        Download the kit — free
      </ButtonLink>
      <p className="text-ui text-ink-3">
        MIT · 20 files, 23 components · no npm package to install
      </p>
    </div>
  );
}
