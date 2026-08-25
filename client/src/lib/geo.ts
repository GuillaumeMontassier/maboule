export interface LatLngCoordinates {
    latitude: number
    longitude: number
}

// GeoJSON stocke ses coordonnees en [longitude, latitude] ; Leaflet et
// `BoulodromeHistoryEntry` attendent l'ordre inverse - point de conversion
// unique pour que cette convention ne soit connue qu'a un seul endroit
// (BoulodromesMap.tsx et lib/boulodrome-selection.ts en dependent tous les
// deux).
export function geoJsonCoordinatesToLatLng([longitude, latitude]: number[]): LatLngCoordinates {
    return { latitude, longitude }
}
