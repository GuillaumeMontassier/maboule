import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet calcule les URLs de ses icones par defaut a partir de son propre
// chemin de module, ce qui casse une fois passe par le bundler de Vite (les
// images ne sont plus au chemin attendu). Fix standard : on importe les
// images via Vite (qui les resout en URLs correctes) et on les reinjecte
// dans les options par defaut. A importer une seule fois, avant le premier
// rendu d'une carte.
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
