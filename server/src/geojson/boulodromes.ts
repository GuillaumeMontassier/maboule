import type { Feature, FeatureCollection, Point } from 'geojson'
import type { BoulodromeRow } from '../db/boulodromesRepository'

export interface BoulodromeProperties {
    id: string
    name: string
    street: string
    postalCode: string
    city: string
    inseeCode: string | null
    siteName: string | null
    equipmentType: string | null
    groundType: string | null
    freeAccess: boolean | null
    source: string
    lastSyncedAt: string
}

export type BoulodromeFeature = Feature<Point, BoulodromeProperties>
export type BoulodromeFeatureCollection = FeatureCollection<Point, BoulodromeProperties>

export function toBoulodromeFeatureCollection(rows: BoulodromeRow[]): BoulodromeFeatureCollection {
    return {
        type: 'FeatureCollection',
        features: rows.map(toBoulodromeFeature)
    }
}

function toBoulodromeFeature(row: BoulodromeRow): BoulodromeFeature {
    return {
        type: 'Feature',
        // GeoJSON impose l'ordre [longitude, latitude], l'inverse de ce qu'on
        // lit d'habitude sur une carte (lat/lon) — piege deja rencontre lors de
        // l'import (ST_MakePoint attend aussi lon puis lat).
        geometry: {
            type: 'Point',
            coordinates: [row.longitude, row.latitude]
        },
        properties: {
            id: row.id,
            name: row.name,
            street: row.street,
            postalCode: row.postalCode,
            city: row.city,
            inseeCode: row.inseeCode,
            siteName: row.siteName,
            equipmentType: row.equipmentType,
            groundType: row.groundType,
            freeAccess: row.freeAccess,
            source: row.source,
            lastSyncedAt: row.lastSyncedAt.toISOString()
        }
    }
}
