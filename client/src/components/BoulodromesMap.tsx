import "leaflet/dist/leaflet.css";
import "../leaflet-icon-fix";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, ZoomControl } from "react-leaflet";
import { fetchCafesNearBoulodrome } from "../api/cafes";
import type { CafeAmenityType, CafesFeatureCollection } from "../api/cafes";
import type { BoulodromesFeatureCollection } from "../api/boulodromes";
import type { RouteFeature } from "../api/route";
import { BoulodromeSearch } from "./BoulodromeSearch";
import { RoutePanel } from "./RoutePanel";
import { useBoulodromeHistory } from "../hooks/use-boulodrome-history";
import { computePopupAutoPanPadding } from "../lib/popup-auto-pan";

const PARIS_CENTER: [number, number] = [48.8566, 2.3522];

// Chrome pilule partage par les badges de contenu de popup (acces libre/payant,
// distance des cafes) - seule la couleur varie entre usages.
const POPUP_BADGE_CLASS = "mt-1 inline-block rounded-full px-2 py-0.5 text-[0.85em] font-semibold";

// Point colore a contour blanc, commun aux 4 types (pieton/cafe/bar/pub) ;
// seule la couleur varie. Classes Tailwind completes et statiques (pas de
// `bg-${amenityType}`) pour que le scanner JIT les detecte malgre
// l'interpolation de template literal.
const CAFE_DOT_COLOR_BY_AMENITY: Record<CafeAmenityType, string> = {
  cafe: "bg-amber-600",
  bar: "bg-purple-500",
  pub: "bg-orange-600",
};

function dotMarkerHtml(colorClass: string): string {
  return `<span class="block h-4 w-4 rounded-full border-2 border-white shadow-md ${colorClass}"></span>`;
}

function cafeIcon(amenityType: CafeAmenityType): L.DivIcon {
  const colorClass = CAFE_DOT_COLOR_BY_AMENITY[amenityType] ?? "bg-gray-500";
  return L.divIcon({
    className: "cafe-marker",
    html: dotMarkerHtml(colorClass),
    iconSize: [24, 24],
  });
}

const routeStartIcon = L.divIcon({
  className: "route-start-marker",
  html: dotMarkerHtml("bg-blue-500"),
  iconSize: [24, 24],
});

// Geometrie des panneaux calculee par `computePopupAutoPanPadding` (lib
// testee independamment) - recalculee a chaque rendu plutot que figee au
// chargement du module, car une popup peut s'ouvrir apres un
// redimensionnement de fenetre (rotation d'ecran, redimensionnement
// navigateur) : seule la lecture de `window.innerWidth` reste ici, le calcul
// lui-meme est une fonction pure sans dependance au DOM.

// GeoJSON = [longitude, latitude], Leaflet = [latitude, longitude].
function toLatLng([longitude, latitude]: number[]): [number, number] {
  return [latitude, longitude];
}

interface BoulodromesMapProps {
  features: BoulodromesFeatureCollection;
}

export function BoulodromesMap({ features }: BoulodromesMapProps) {
  // Id du boulodrome dont le popup est actuellement ouvert - pilote le
  // chargement et l'affichage des cafes a proximite (un seul popup Leaflet
  // ouvert a la fois, donc un seul jeu de cafes affiche a la fois).
  const [selectedBoulodromeId, setSelectedBoulodromeId] = useState<string | null>(null);
  const [nearbyCafes, setNearbyCafes] = useState<CafesFeatureCollection | null>(null);
  // Tracé de l'itinéraire en cours, pilote par RoutePanel (chargement
  // déclenché par l'utilisateur, contrairement aux cafés qui se chargent
  // automatiquement à la sélection).
  const [route, setRoute] = useState<RouteFeature | null>(null);
  // Instances Leaflet des marqueurs boulodromes, pour pouvoir fermer
  // explicitement l'ancien popup au clic sur un nouveau (cf. commentaire sur
  // `autoClose` plus bas).
  const boulodromeMarkers = useRef(new Map<string, L.Marker>());
  // Instance Leaflet de la carte, pour piloter le recentrage (`flyTo`) au
  // clic sur un marqueur ou a la selection d'un resultat de recherche.
  const mapRef = useRef<L.Map | null>(null);
  const { history, addToHistory, removeFromHistory } = useBoulodromeHistory();

  useEffect(() => {
    if (!selectedBoulodromeId) {
      setNearbyCafes(null);
      return;
    }

    let cancelled = false;
    fetchCafesNearBoulodrome(selectedBoulodromeId)
      .then((data) => {
        if (!cancelled) setNearbyCafes(data);
      })
      .catch(() => {
        // Best-effort : un probleme sur les cafes ne doit pas empecher
        // d'afficher la popup du boulodrome lui-meme.
        if (!cancelled) setNearbyCafes(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedBoulodromeId]);

  // Selectionne un boulodrome et ouvre son popup - factorise pour etre
  // declenche aussi bien par un clic sur son marqueur que par le choix d'un
  // resultat de recherche (meme etat, meme popup dans les deux cas). La
  // recherche interroge l'API sans tenir compte des filtres actifs (nature du
  // sol, etc.) : un resultat peut donc referencer un boulodrome absent de
  // `features` et donc sans marqueur sur la carte. Dans ce cas, on ne fait
  // rien plutot que de selectionner un boulodrome invisible (ce qui
  // declencherait quand meme le chargement des cafes a proximite, sans
  // aucune popup ni marqueur pour les rattacher visuellement).
  function selectBoulodrome(id: string) {
    const marker = boulodromeMarkers.current.get(id);
    if (!marker) return;
    if (selectedBoulodromeId && selectedBoulodromeId !== id) {
      boulodromeMarkers.current.get(selectedBoulodromeId)?.closePopup();
    }
    setSelectedBoulodromeId(id);
    marker.openPopup();

    // Alimente l'historique quel que soit le moyen de selection (marqueur,
    // recherche, historique lui-meme) puisqu'ils passent tous par cette
    // fonction.
    const feature = features.features.find((candidate) => candidate.properties.id === id);
    if (feature) addToHistory({ id, name: feature.properties.name, siteName: feature.properties.siteName });

    // Recentrage anime plutot qu'un saut instantane. Appeler `flyTo` alors
    // qu'une animation precedente est encore en cours ne pose pas de
    // probleme : Leaflet l'interrompt lui-meme en debut d'appel avant de
    // demarrer la nouvelle.
    const map = mapRef.current;
    if (map) {
      const currentZoom = map.getZoom();
      const targetZoom = currentZoom >= 15 ? currentZoom : 16;
      map.flyTo(marker.getLatLng(), targetZoom);
    }
  }

  const routePositions: [number, number][] | null =
    route?.geometry.coordinates.map(toLatLng) ?? null;
  const routeStartPosition = routePositions?.[0] ?? null;

  // Recalculee a chaque rendu (pas de useMemo) : lire `window.innerWidth`
  // ici, au moment du rendu, est ce qui permet a une popup ouverte apres un
  // redimensionnement de fenetre d'obtenir la bonne marge (cf. commentaire
  // sur `computePopupAutoPanPadding`).
  const popupAutoPanPadding = computePopupAutoPanPadding(window.innerWidth);

  return (
    <>
      <BoulodromeSearch
        onSelectBoulodrome={selectBoulodrome}
        history={history}
        onRemoveFromHistory={removeFromHistory}
      />
      {selectedBoulodromeId && (
        <RoutePanel key={selectedBoulodromeId} boulodromeId={selectedBoulodromeId} onRouteChange={setRoute} />
      )}
      <MapContainer ref={mapRef} center={PARIS_CENTER} zoom={12} zoomControl={false} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Repositionne les boutons de zoom en bas a droite (ticket 07),
            hors de leur emplacement Leaflet par defaut (haut a gauche) qui
            chevauchait la barre de recherche. */}
        <ZoomControl position="bottomright" />
        {features.features.map((feature) => {
          const id = feature.properties.id;
          return (
            <Marker
              key={id}
              ref={(marker) => {
                if (marker) boulodromeMarkers.current.set(id, marker);
                else boulodromeMarkers.current.delete(id);
              }}
              position={toLatLng(feature.geometry.coordinates)}
              // Nom accessible du marqueur - sans ce prop, Leaflet retombe sur
              // l'alt par defaut "Marker", identique pour les 64 marqueurs et
              // inutilisable au clavier/lecteur d'ecran pour les distinguer
              // (ticket 14).
              alt={feature.properties.name}
              eventHandlers={{
                // `selectBoulodrome` gere elle-meme la fermeture explicite de
                // l'ancien popup (necessaire car `autoClose` est desactive
                // ci-dessous sur la Popup - cf. commentaire `autoClose`).
                click: () => selectBoulodrome(id),
                // Le mixin popup de Leaflet ouvre le popup au clavier (Entree)
                // via son propre gestionnaire interne `keypress` -> `_openPopup`
                // (`leaflet-src.js`, mixin Popup), completement independant de
                // l'evenement `click` ci-dessus : sans cet ecouteur explicite,
                // l'activation clavier d'un marqueur ouvrait le popup Leaflet
                // brut sans jamais appeler `selectBoulodrome` - donc sans
                // panneau Itineraire, sans cafes a proximite et sans ajout a
                // l'historique (ticket 13). Meme condition de declenchement
                // que le mixin interne (touche Entree) pour rester synchronise
                // avec le moment ou Leaflet ouvre effectivement le popup.
                keypress: (event) => {
                  if (event.originalEvent.key === "Enter") selectBoulodrome(id);
                },
                popupclose: () => setSelectedBoulodromeId((current) => (current === id ? null : current)),
              }}
            >
              {/*
                Deux mecanismes Leaflet independants ferment normalement ce
                popup des qu'on clique sur un marqueur cafe affiche par-dessus,
                et il faut desactiver les deux :
                - autoClose (defaut true) : ferme le popup ouvert quand un AUTRE
                  popup s'ouvre (celui du cafe cliqué).
                - closeOnClick (defaut = closePopupOnClick de la carte, true) :
                  ferme le popup des qu'on clique n'importe ou ailleurs sur la
                  carte - y compris sur un marqueur cafe, qui n'est pas
                  distingue d'un clic dans le vide.
                Sans ca, `popupclose` se declenche ici, vide `nearbyCafes` et
                demonte le marqueur cafe au moment meme ou son propre popup
                tente de s'ouvrir. La fermeture est donc geree explicitement
                nous-memes (cf. eventHandlers.click ci-dessus) plutot que par
                ces comportements automatiques.
              */}
              <Popup
                autoClose={false}
                closeOnClick={false}
                autoPanPaddingTopLeft={popupAutoPanPadding.topLeft}
                autoPanPaddingBottomRight={popupAutoPanPadding.bottomRight}
              >
                <strong>{feature.properties.name}</strong>
                {feature.properties.siteName && feature.properties.siteName !== feature.properties.name && (
                  <>
                    <br />
                    {feature.properties.siteName}
                  </>
                )}
                <br />
                {feature.properties.street}, {feature.properties.postalCode}{" "}
                {feature.properties.city}
                {(feature.properties.equipmentType || feature.properties.groundType) && (
                  <>
                    <br />
                    {[feature.properties.equipmentType, feature.properties.groundType]
                      .filter(Boolean)
                      .join(" · ")}
                  </>
                )}
                {feature.properties.freeAccess !== null && (
                  <>
                    <br />
                    <span
                      className={`${POPUP_BADGE_CLASS} ${
                        feature.properties.freeAccess
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                      }`}
                    >
                      {feature.properties.freeAccess ? "Accès libre" : "Accès payant / restreint"}
                    </span>
                  </>
                )}
              </Popup>
            </Marker>
          );
        })}
        {nearbyCafes?.features.map((cafe) => {
          return (
            <Marker
              key={cafe.properties.id}
              position={toLatLng(cafe.geometry.coordinates)}
              icon={cafeIcon(cafe.properties.amenityType)}
              // `alt` (contrairement au marqueur boulodrome ci-dessus) n'a
              // aucun effet ici : Leaflet ne l'applique qu'aux icones <img>
              // (`Marker._initIcon`, leaflet-src.js), or `cafeIcon` est un
              // `L.divIcon` (un <div>). `title` en revanche est un attribut
              // HTML standard sur toute balise et sert de nom accessible de
              // repli en l'absence d'aria-label (ticket 14) - sans lui, ce
              // marqueur (focusable au clavier, `role="button"` pose par
              // Leaflet) n'a aucun nom accessible du tout.
              title={cafe.properties.name}
            >
              <Popup
                autoPanPaddingTopLeft={popupAutoPanPadding.topLeft}
                autoPanPaddingBottomRight={popupAutoPanPadding.bottomRight}
              >
                <strong>{cafe.properties.name}</strong>
                <br />
                <span className={`${POPUP_BADGE_CLASS} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200`}>
                  {cafe.properties.distanceMeters} m du boulodrome
                </span>
                {cafe.properties.street && (
                  <>
                    <br />
                    {cafe.properties.street}
                    {cafe.properties.postalCode ? `, ${cafe.properties.postalCode}` : ""}
                    {cafe.properties.city ? ` ${cafe.properties.city}` : ""}
                  </>
                )}
              </Popup>
            </Marker>
          );
        })}
        {routePositions && routeStartPosition && (
          <>
            <Polyline positions={routePositions} />
            <Marker
              position={routeStartPosition}
              icon={routeStartIcon}
              title="Point de départ de l'itinéraire"
            />
          </>
        )}
      </MapContainer>
    </>
  );
}
