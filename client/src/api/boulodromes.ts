import type { FeatureCollection, Point } from 'geojson'

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

export type BoulodromesFeatureCollection = FeatureCollection<Point, BoulodromeProperties>

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Rectangle englobant WGS84, meme convention que le `bbox` GeoJSON (west,
// south, east, north) et le parametre attendu cote serveur
// (`boulodromesQuery.ts`).
export interface Bbox {
    west: number
    south: number
    east: number
    north: number
}

export interface BoulodromesFilters {
    groundTypes?: string[]
    equipmentTypes?: string[]
    freeAccess?: boolean
    search?: string
    bbox?: Bbox
}

export async function fetchBoulodromes(filters: BoulodromesFilters = {}): Promise<BoulodromesFeatureCollection> {
    const params = new URLSearchParams()
    for (const groundType of filters.groundTypes ?? []) {
        params.append('groundType', groundType)
    }
    for (const equipmentType of filters.equipmentTypes ?? []) {
        params.append('equipmentType', equipmentType)
    }
    if (filters.freeAccess !== undefined) {
        params.append('freeAccess', String(filters.freeAccess))
    }
    if (filters.search) {
        params.append('q', filters.search)
    }
    if (filters.bbox) {
        const { west, south, east, north } = filters.bbox
        params.append('bbox', `${west},${south},${east},${north}`)
    }
    const query = params.toString()

    const response = await fetch(`${API_URL}/api/boulodromes${query ? `?${query}` : ''}`)
    if (!response.ok) {
        throw new Error(`Erreur lors du chargement des boulodromes (${response.status})`)
    }
    return response.json()
}
