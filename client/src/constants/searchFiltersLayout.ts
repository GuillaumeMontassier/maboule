// Geometrie du bloc recherche + filtres empile en mobile (cf. classes
// Tailwind `top-3`/`top-14` sur BoulodromeSearch.tsx/App.tsx) - utilisee pour
// reserver l'auto-pan des popups Leaflet cote BoulodromesMap (ticket 12),
// meme principe que ROUTE_PANEL_LAYOUT.maxHeightPx pour RoutePanel (ticket
// 09) : les classes Tailwind elles-memes restent des chaines litterales
// (requis par le scanner JIT), a garder synchronisees avec ces valeurs en cas
// de changement de mise en page.
export const MOBILE_BREAKPOINT_PX = 768 // meme valeur que le variant Tailwind `md:`

// Hauteur mesuree en navigateur (Playwright) a 375px de large, etat par
// defaut (recherche non focalisee - donc pas d'historique/resultats deroules
// - et fieldsets de filtres non deplies). Un utilisateur qui clique un
// marqueur de la carte a deja perdu le focus du champ de recherche (le clic
// sur la carte le lui retire), donc l'etat dropdown ouvert n'a pas besoin
// d'etre couvert ici. Arrondie a la hausse (mesure : 297px).
export const MOBILE_SEARCH_FILTERS_HEIGHT_PX = 300
