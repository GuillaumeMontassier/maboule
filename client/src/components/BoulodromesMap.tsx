import 'leaflet/dist/leaflet.css'
import '../leaflet-icon-fix'
import L from 'leaflet'
import { useState } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, ZoomControl } from 'react-leaflet'
import type { CafeAmenityType } from '../api/cafes'
import type { Bbox, BoulodromeProperties, BoulodromesFeatureCollection } from '../api/boulodromes'
import type { RouteFeature } from '../api/route'
import { BoulodromeDetailsPanel } from './BoulodromeDetailsPanel'
import { BoundsWatcher } from './BoundsWatcher'
import { BoulodromeSearch } from './BoulodromeSearch'
import { MapClickDeselect } from './MapClickDeselect'
import { RoutePanel } from './RoutePanel'
import { useBoulodromeSelection } from '../hooks/use-boulodrome-selection'
import { toBoulodromeHistoryEntry } from '../lib/boulodrome-selection'
import { geoJsonCoordinatesToLatLng } from '../lib/geo'
import { computePopupAutoPanPadding } from '../lib/popup-auto-pan'
import { distinctSiteName } from '../lib/site-name'
import { PILL_BADGE_CLASS } from './surfaceStyles'

const PARIS_CENTER: [number, number] = [48.8566, 2.3522]

// Point colore a contour blanc, commun aux 4 types (pieton/cafe/bar/pub) ;
// seule la couleur varie. Classes Tailwind completes et statiques (pas de
// `bg-${amenityType}`) pour que le scanner JIT les detecte malgre
// l'interpolation de template literal.
const CAFE_DOT_COLOR_BY_AMENITY: Record<CafeAmenityType, string> = {
    cafe: 'bg-amber-600',
    bar: 'bg-purple-500',
    pub: 'bg-orange-600'
}

function dotMarkerHtml(colorClass: string): string {
    return `<span class="block h-4 w-4 rounded-full border-2 border-white shadow-md ${colorClass}"></span>`
}

function cafeIcon(amenityType: CafeAmenityType): L.DivIcon {
    const colorClass = CAFE_DOT_COLOR_BY_AMENITY[amenityType] ?? 'bg-gray-500'
    return L.divIcon({
        className: 'cafe-marker',
        html: dotMarkerHtml(colorClass),
        iconSize: [24, 24]
    })
}

const routeStartIcon = L.divIcon({
    className: 'route-start-marker',
    html: dotMarkerHtml('bg-blue-500'),
    iconSize: [24, 24]
})

// Geometrie des panneaux calculee par `computePopupAutoPanPadding` (lib
// testee independamment) - recalculee a chaque rendu plutot que figee au
// chargement du module, car une popup peut s'ouvrir apres un
// redimensionnement de fenetre (rotation d'ecran, redimensionnement
// navigateur) : seule la lecture de `window.innerWidth` reste ici, le calcul
// lui-meme est une fonction pure sans dependance au DOM.

// Leaflet attend un tuple [latitude, longitude] (`geoJsonCoordinatesToLatLng`
// gere la conversion depuis l'ordre GeoJSON [longitude, latitude]).
function toLatLng(coordinates: number[]): [number, number] {
    const { latitude, longitude } = geoJsonCoordinatesToLatLng(coordinates)
    return [latitude, longitude]
}

// Nom accessible du marqueur (`alt`) - `name` seul est un champ de type
// d'equipement generique ("TERRAIN DE PETANQUE", "BOULODROME"), partage par
// la plupart des 64 boulodromes de la base (ticket 26). On y ajoute
// `siteName` (quand il differe, meme garde que la popup ci-dessous et
// l'historique de recherche du ticket 23, via `distinctSiteName`) puis la
// rue pour obtenir un texte qui distingue reellement un boulodrome d'un
// autre au clavier/lecteur d'ecran - best effort, sans garantie d'unicite
// absolue en cas de doublon exact de nom et de rue. La rue n'est ajoutee que
// si elle est renseignee, pour eviter une virgule trainante lue par le
// lecteur d'ecran sur un enregistrement dont l'adresse est vide.
function accessibleMarkerName(properties: BoulodromeProperties): string {
    const siteName = distinctSiteName(properties.name, properties.siteName)
    const street = properties.street.trim()
    const base = siteName ? `${properties.name} – ${siteName}` : properties.name
    return street ? `${base}, ${street}` : base
}

interface BoulodromesMapProps {
    features: BoulodromesFeatureCollection
    // Optionnel : les tests de ce composant passent directement `features`
    // sans exercer le fetch bbox-scope (couvert separement par les tests du
    // hook `useBoulodromes` et par le describe "chargement par viewport"
    // ci-dessous), donc sans avoir besoin de fournir ce callback.
    onBoundsChange?: (bbox: Bbox) => void
}

export function BoulodromesMap({ features, onBoundsChange }: BoulodromesMapProps) {
    const {
        mapRef,
        selectedBoulodromeId,
        nearbyCafes,
        history,
        removeFromHistory,
        selectBoulodrome,
        deselectBoulodrome
    } = useBoulodromeSelection(features)
    // Tracé de l'itinéraire en cours, pilote par RoutePanel (chargement
    // déclenché par l'utilisateur, contrairement aux cafés qui se chargent
    // automatiquement à la sélection).
    const [route, setRoute] = useState<RouteFeature | null>(null)

    const routePositions: [number, number][] | null = route?.geometry.coordinates.map(toLatLng) ?? null
    const routeStartPosition = routePositions?.[0] ?? null

    // Recalculee a chaque rendu (pas de useMemo) : lire `window.innerWidth`
    // ici, au moment du rendu, est ce qui permet a une popup ouverte apres un
    // redimensionnement de fenetre d'obtenir la bonne marge (cf. commentaire
    // sur `computePopupAutoPanPadding`).
    const popupAutoPanPadding = computePopupAutoPanPadding(window.innerWidth)

    // Contenu de la Fiche boulodrome (BoulodromeDetailsPanel) : derive de
    // `features`, jamais d'un marqueur Leaflet (il n'y a plus de popup a
    // rouvrir). Un boulodrome selectionne hors du bbox actuellement charge
    // (recherche/historique, ticket 36) n'a donc pas encore de fiche - elle
    // apparait d'elle-meme des qu'un fetch bbox ulterieur l'inclut dans
    // `features`, meme comportement que l'ancienne popup.
    const selectedFeature = features.features.find((feature) => feature.properties.id === selectedBoulodromeId)

    return (
        <>
            <BoulodromeSearch
                onSelectBoulodrome={selectBoulodrome}
                history={history}
                onRemoveFromHistory={removeFromHistory}
            />
            {selectedBoulodromeId && selectedFeature && (
                <BoulodromeDetailsPanel
                    properties={selectedFeature.properties}
                    onClose={() => deselectBoulodrome(selectedBoulodromeId)}
                />
            )}
            {selectedBoulodromeId && (
                <RoutePanel key={selectedBoulodromeId} boulodromeId={selectedBoulodromeId} onRouteChange={setRoute} />
            )}
            <MapContainer ref={mapRef} center={PARIS_CENTER} zoom={12} zoomControl={false} className="map">
                {onBoundsChange && <BoundsWatcher onBoundsChange={onBoundsChange} />}
                <MapClickDeselect selectedBoulodromeId={selectedBoulodromeId} onDeselect={deselectBoulodrome} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Repositionne les boutons de zoom en bas a droite (ticket 07),
            hors de leur emplacement Leaflet par defaut (haut a gauche) qui
            chevauchait la barre de recherche. */}
                <ZoomControl position="bottomright" />
                {features.features.map((feature) => {
                    const id = feature.properties.id
                    const historyEntry = toBoulodromeHistoryEntry(feature)
                    return (
                        <Marker
                            key={id}
                            position={toLatLng(feature.geometry.coordinates)}
                            // Nom accessible du marqueur - sans ce prop, Leaflet retombe sur
                            // l'alt par defaut "Marker", identique pour les 64 marqueurs et
                            // inutilisable au clavier/lecteur d'ecran pour les distinguer
                            // (ticket 14). `accessibleMarkerName` combine name/siteName et
                            // la rue pour que cette distinction soit reelle, pas seulement
                            // vis-a-vis d'un `<img>` sans nom (ticket 26).
                            alt={accessibleMarkerName(feature.properties)}
                            eventHandlers={{
                                click: () => selectBoulodrome(historyEntry),
                                // Le mixin popup de Leaflet ouvrait autrefois le popup au clavier
                                // (Entree seulement) via son propre gestionnaire interne
                                // `keypress` -> `_openPopup` (`leaflet-src.js`, mixin Popup) - la
                                // Fiche n'etant plus une popup, cet ecouteur explicite reste
                                // necessaire pour que l'activation clavier appelle bien
                                // `selectBoulodrome` (panneau Itineraire, cafes a proximite,
                                // historique, ticket 13). Espace egalement gere ici
                                // (contrairement au mixin interne de Leaflet, qui ne reagit qu'a
                                // Entree) : le marqueur porte `role="button"` (pose par Leaflet),
                                // et la spec WAI-ARIA attend qu'un role=button reagisse aux deux
                                // touches. `preventDefault` sur Espace evite le defilement de page
                                // (comportement par defaut du navigateur sur un element
                                // focusable non-formulaire).
                                keypress: (event) => {
                                    const key = event.originalEvent.key
                                    if (key !== 'Enter' && key !== ' ') return
                                    if (key === ' ') event.originalEvent.preventDefault()
                                    selectBoulodrome(historyEntry)
                                }
                            }}
                        />
                    )
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
                                <span
                                    className={`${PILL_BADGE_CLASS} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200`}
                                >
                                    {cafe.properties.distanceMeters} m du boulodrome
                                </span>
                                {cafe.properties.street && (
                                    <>
                                        <br />
                                        {cafe.properties.street}
                                        {cafe.properties.postalCode ? `, ${cafe.properties.postalCode}` : ''}
                                        {cafe.properties.city ? ` ${cafe.properties.city}` : ''}
                                    </>
                                )}
                            </Popup>
                        </Marker>
                    )
                })}
                {routePositions && routeStartPosition && (
                    <>
                        <Polyline positions={routePositions} />
                        <Marker position={routeStartPosition} icon={routeStartIcon} title="Point de départ de l'itinéraire" />
                    </>
                )}
            </MapContainer>
        </>
    )
}
