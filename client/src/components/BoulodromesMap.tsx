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

const PARIS_CENTER: [number, number] = [48.8566, 2.3522];

// Emoji plutot que trois images d'icones dediees : suffisant pour
// differencier cafe/bar/pub visuellement sans gerer de nouveaux assets.
const CAFE_EMOJI_BY_AMENITY: Record<CafeAmenityType, string> = {
  cafe: "☕",
  bar: "🍸",
  pub: "🍺",
};

function cafeIcon(amenityType: CafeAmenityType): L.DivIcon {
  return L.divIcon({
    className: "cafe-marker",
    html: CAFE_EMOJI_BY_AMENITY[amenityType] ?? "📍",
    iconSize: [24, 24],
  });
}

const routeStartIcon = L.divIcon({
  className: "route-start-marker",
  html: "🚶",
  iconSize: [24, 24],
});

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
  const { history, addToHistory } = useBoulodromeHistory();

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
    if (feature) addToHistory({ id, name: feature.properties.name });

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

  return (
    <>
      <BoulodromeSearch onSelectBoulodrome={selectBoulodrome} history={history} />
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
              eventHandlers={{
                // `selectBoulodrome` gere elle-meme la fermeture explicite de
                // l'ancien popup (necessaire car `autoClose` est desactive
                // ci-dessous sur la Popup - cf. commentaire `autoClose`).
                click: () => selectBoulodrome(id),
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
              <Popup autoClose={false} closeOnClick={false}>
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
                    <span className={`access-badge ${feature.properties.freeAccess ? "access-badge--free" : "access-badge--restricted"}`}>
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
            >
              <Popup>
                <strong>{cafe.properties.name}</strong>
                <br />
                {cafe.properties.distanceMeters} m du boulodrome
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
            <Marker position={routeStartPosition} icon={routeStartIcon} />
          </>
        )}
      </MapContainer>
    </>
  );
}
