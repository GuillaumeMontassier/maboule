import type { PointExpression } from "leaflet";
import { ROUTE_PANEL_LAYOUT } from "../constants/routePanelLayout";
import { MOBILE_BREAKPOINT_PX, MOBILE_SEARCH_FILTERS_HEIGHT_PX } from "../constants/searchFiltersLayout";

export interface PopupAutoPanPadding {
  topLeft: PointExpression;
  bottomRight: PointExpression;
}

// Le RoutePanel (bas-gauche) et le bloc recherche + filtres (haut) sont des
// overlays React positionnes par-dessus la carte, invisibles du mecanisme
// d'auto-pan de Leaflet - sans ce reglage, un popup ouvert pres d'un de ces
// bords peut se retrouver visuellement dessous (z-index plus eleve) plutot
// que d'etre repousse par l'auto-pan. Leaflet ne reserve que des marges
// rectangulaires depuis chaque bord (pas un rectangle arbitraire dans un
// coin) : on reserve donc une marge large a la fois a gauche (RoutePanel) et
// en haut (recherche + filtres), calculee a partir de `ROUTE_PANEL_LAYOUT` et
// `MOBILE_SEARCH_FILTERS_HEIGHT_PX` (sources communes avec les classes
// Tailwind des panneaux) plutot que sur des constantes deconnectees.
//
// La marge du haut ne s'applique qu'en mobile (< `MOBILE_BREAKPOINT_PX`) :
// en desktop, recherche et filtres sont cote a cote (pas empiles) et ne
// depassent pas la petite marge par defaut deja verifiee par le ticket 09.
//
// `viewportWidthPx` est un parametre plutot qu'une lecture directe de
// `window.innerWidth` : une popup peut s'ouvrir apres un redimensionnement de
// fenetre (rotation d'ecran, redimensionnement navigateur), donc l'appelant
// (BoulodromesMap) doit relire la largeur a chaque rendu - et ce module reste
// testable sans DOM.
export function computePopupAutoPanPadding(viewportWidthPx: number): PopupAutoPanPadding {
  const isMobile = viewportWidthPx < MOBILE_BREAKPOINT_PX;
  return {
    topLeft: [
      ROUTE_PANEL_LAYOUT.widthPx + ROUTE_PANEL_LAYOUT.marginPx * 2,
      isMobile ? MOBILE_SEARCH_FILTERS_HEIGHT_PX : 16,
    ],
    bottomRight: [16, ROUTE_PANEL_LAYOUT.maxHeightPx],
  };
}
