import type { BoulodromesFeatureCollection } from '../api/boulodromes'
import type { BoulodromeHistoryEntry } from '../hooks/use-boulodrome-history'
import { geoJsonCoordinatesToLatLng } from './geo'

type BoulodromeFeature = BoulodromesFeatureCollection['features'][number]

// Construit la charge utile de selection (marqueur carte, resultat de
// recherche) partagee par `onSelectBoulodrome` et l'historique - appelee a la
// fois par BoulodromesMap (pour les marqueurs) et BoulodromeSearch (pour les
// resultats), pour que les deux s'accordent sur la meme forme plutot que de
// la reconstruire chacun de leur cote (ticket 36 : ce champ pilote le
// `flyTo` d'un boulodrome hors du viewport bbox actuel).
export function toBoulodromeHistoryEntry(feature: BoulodromeFeature): BoulodromeHistoryEntry {
    return {
        id: feature.properties.id,
        name: feature.properties.name,
        siteName: feature.properties.siteName,
        coordinates: geoJsonCoordinatesToLatLng(feature.geometry.coordinates)
    }
}
