// Geometrie du RoutePanel (cf. classes Tailwind sur son conteneur dans
// `RoutePanel.tsx`) - partagee avec BoulodromesMap pour calculer la marge
// d'auto-pan des popups Leaflet a partir des memes valeurs plutot que de la
// dupliquer en constantes deconnectees. Les classes Tailwind elles-memes
// restent des chaines litterales (requis par le scanner JIT) : en cas de
// changement de mise en page, les garder synchronisees avec cet objet.
export const ROUTE_PANEL_LAYOUT = {
  widthPx: 280,
  marginPx: 12,
  // Hauteur mesuree en navigateur (Playwright) dans l'etat le plus grand du
  // panneau (choix d'adresse ambigue, liste plafonnee par `max-h-40`),
  // arrondie a la hausse.
  maxHeightPx: 325,
} as const;
