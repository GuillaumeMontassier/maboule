import type { Feature, FeatureCollection, Point } from 'geojson'
import type { CafeWithDistanceRow } from '../db/cafesRepository'

export interface CafeProperties {
    id: string
    name: string
    amenityType: string
    street: string | null
    postalCode: string | null
    city: string | null
    source: string
    lastSyncedAt: string
    distanceMeters: number
}

export type CafeFeature = Feature<Point, CafeProperties>
export type CafeFeatureCollection = FeatureCollection<Point, CafeProperties>

export function toCafeFeatureCollection(rows: CafeWithDistanceRow[]): CafeFeatureCollection {
    return {
        type: 'FeatureCollection',
        features: rows.map(toCafeFeature)
    }
}

function toCafeFeature(row: CafeWithDistanceRow): CafeFeature {
    return {
        type: 'Feature',
        // [longitude, latitude], convention GeoJSON (cf. geojson/boulodromes.ts).
        geometry: {
            type: 'Point',
            coordinates: [row.longitude, row.latitude]
        },
        properties: {
            id: row.id,
            name: row.name,
            amenityType: row.amenityType,
            street: row.street,
            postalCode: row.postalCode,
            city: row.city,
            source: row.source,
            lastSyncedAt: row.lastSyncedAt.toISOString(),
            // Arrondie au metre : la precision sub-metrique de ST_Distance n'a pas
            // de sens pour l'utilisateur final ni de garantie de stabilite d'un
            // calcul a l'autre.
            distanceMeters: Math.round(row.distanceMeters)
        }
    }
}
