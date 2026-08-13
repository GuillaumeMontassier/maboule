import "leaflet/dist/leaflet.css";
import "../leaflet-icon-fix";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { fetchCafesNearBoulodrome } from "../api/cafes";
import type { CafeAmenityType, CafesFeatureCollection } from "../api/cafes";
import type { BoulodromesFeatureCollection } from "../api/boulodromes";
import { BoulodromeSearch } from "./BoulodromeSearch";

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

interface BoulodromesMapProps {
  features: BoulodromesFeatureCollection;
}

export function BoulodromesMap({ features }: BoulodromesMapProps) {
  // Id du boulodrome dont le popup est actuellement ouvert - pilote le
  // chargement et l'affichage des cafes a proximite (un seul popup Leaflet
  // ouvert a la fois, donc un seul jeu de cafes affiche a la fois).
  const [selectedBoulodromeId, setSelectedBoulodromeId] = useState<string | null>(null);
  const [nearbyCafes, setNearbyCafes] = useState<CafesFeatureCollection | null>(null);
  // Instances Leaflet des marqueurs boulodromes, pour pouvoir fermer
  // explicitement l'ancien popup au clic sur un nouveau (cf. commentaire sur
  // `autoClose` plus bas).
  const boulodromeMarkers = useRef(new Map<string, L.Marker>());

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
  }

  return (
    <>
      <BoulodromeSearch onSelectBoulodrome={selectBoulodrome} />
      <MapContainer center={PARIS_CENTER} zoom={12} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {features.features.map((feature) => {
          // GeoJSON = [longitude, latitude], Leaflet = [latitude, longitude].
          const [longitude, latitude] = feature.geometry.coordinates;
          const id = feature.properties.id;
          return (
            <Marker
              key={id}
              ref={(marker) => {
                if (marker) boulodromeMarkers.current.set(id, marker);
                else boulodromeMarkers.current.delete(id);
              }}
              position={[latitude, longitude]}
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
          const [longitude, latitude] = cafe.geometry.coordinates;
          return (
            <Marker
              key={cafe.properties.id}
              position={[latitude, longitude]}
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
      </MapContainer>
    </>
  );
}
