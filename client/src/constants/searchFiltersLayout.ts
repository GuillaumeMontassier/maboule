// Geometrie du bloc recherche + filtres empile (cf. classes Tailwind
// `top-3`/`top-14` sur BoulodromeSearch.tsx/App.tsx) - utilisee pour reserver
// l'auto-pan des popups Leaflet cote BoulodromesMap (ticket 12), meme
// principe que ROUTE_PANEL_LAYOUT.maxHeightPx pour RoutePanel (ticket 09) :
// les classes Tailwind elles-memes restent des chaines litterales (requis
// par le scanner JIT), a garder synchronisees avec ces valeurs en cas de
// changement de mise en page.
export const MOBILE_BREAKPOINT_PX = 768 // meme valeur que le variant Tailwind `md:`

// Depuis le passage des filtres en pleine largeur sous la recherche a toutes
// les tailles d'ecran (ticket 34), le bloc est empile aux deux tailles - seul
// le scroll horizontal mobile (barre de defilement native, absente en
// desktop faute de debordement) distingue encore les deux hauteurs
// mesurees ci-dessous.

// Hauteur mesuree en navigateur (Playwright) a 375px de large : recherche
// (top-3, ~34px) + rangee de filtres sur une seule ligne scrollable (top-14,
// 32px de pilules + barre de defilement horizontale). Arrondie a la hausse
// (mesure : 103px).
export const MOBILE_SEARCH_FILTERS_HEIGHT_PX = 105

// Hauteur mesuree en navigateur (Playwright) a 768px et 1280px de large :
// meme empilement qu'en mobile mais sans barre de defilement (la rangee de
// filtres tient sur une seule ligne sans debordement a ces largeurs).
// Arrondie a la hausse (mesure : 88px).
export const DESKTOP_SEARCH_FILTERS_HEIGHT_PX = 90
