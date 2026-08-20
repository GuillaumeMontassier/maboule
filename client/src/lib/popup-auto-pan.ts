import type { PointExpression } from 'leaflet'
import { ROUTE_PANEL_LAYOUT } from '../constants/routePanelLayout'
import {
    DESKTOP_SEARCH_FILTERS_HEIGHT_PX,
    MOBILE_BREAKPOINT_PX,
    MOBILE_SEARCH_FILTERS_HEIGHT_PX
} from '../constants/searchFiltersLayout'

export interface PopupAutoPanPadding {
    topLeft: PointExpression
    bottomRight: PointExpression
}

// Le RoutePanel (bas-gauche) et le bloc recherche + filtres (haut) sont des
// overlays React positionnes par-dessus la carte, invisibles du mecanisme
// d'auto-pan de Leaflet - sans ce reglage, un popup ouvert pres d'un de ces
// bords peut se retrouver visuellement dessous (z-index plus eleve) plutot
// que d'etre repousse par l'auto-pan. Leaflet ne reserve que des marges
// rectangulaires depuis chaque bord (pas un rectangle arbitraire dans un
// coin) : on reserve donc une marge large a la fois a gauche (RoutePanel) et
// en haut (recherche + filtres), calculee a partir de `ROUTE_PANEL_LAYOUT` et
// des constantes de `searchFiltersLayout` (sources communes avec les classes
// Tailwind des panneaux) plutot que sur des constantes deconnectees.
//
// Depuis le passage des filtres en pleine largeur sous la recherche a toutes
// les tailles d'ecran (ticket 34), le bloc recherche + filtres est empile en
// desktop comme en mobile - la marge du haut s'applique donc désormais aux
// deux, seule sa valeur differe (`MOBILE_SEARCH_FILTERS_HEIGHT_PX` inclut la
// barre de defilement horizontale du ticket 34, absente en desktop faute de
// debordement).
//
// `viewportWidthPx` est un parametre plutot qu'une lecture directe de
// `window.innerWidth` : une popup peut s'ouvrir apres un redimensionnement de
// fenetre (rotation d'ecran, redimensionnement navigateur), donc l'appelant
// (BoulodromesMap) doit relire la largeur a chaque rendu - et ce module reste
// testable sans DOM.
export function computePopupAutoPanPadding(viewportWidthPx: number): PopupAutoPanPadding {
    const isMobile = viewportWidthPx < MOBILE_BREAKPOINT_PX
    return {
        topLeft: [
            ROUTE_PANEL_LAYOUT.widthPx + ROUTE_PANEL_LAYOUT.marginPx * 2,
            isMobile ? MOBILE_SEARCH_FILTERS_HEIGHT_PX : DESKTOP_SEARCH_FILTERS_HEIGHT_PX
        ],
        bottomRight: [16, ROUTE_PANEL_LAYOUT.maxHeightPx]
    }
}
