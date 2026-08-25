import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    fetchBoulodromes,
    type Bbox,
    type BoulodromeProperties,
    type BoulodromesFeatureCollection
} from '../api/boulodromes'

export interface BoulodromesPillFilters {
    groundTypes: string[]
    equipmentTypes: string[]
    freeAccess: boolean | undefined
}

export interface UseBoulodromesResult {
    // Donnees du bbox actuel, filtrees en memoire par les pilules - jamais
    // videes pendant un nouveau fetch (cf. `isFetching` ci-dessous), pour
    // garder les marqueurs deja charges affiches sans clignotement.
    features: BoulodromesFeatureCollection
    isFetching: boolean
    error: string | null
    setBbox: (bbox: Bbox) => void
}

const EMPTY_COLLECTION: BoulodromesFeatureCollection = { type: 'FeatureCollection', features: [] }

function bboxEqual(a: Bbox, b: Bbox): boolean {
    return a.west === b.west && a.south === b.south && a.east === b.east && a.north === b.north
}

// Un filtre actif (liste non vide) exclut une valeur absente (`null`) : une
// fiche sans nature de sol renseignee ne doit matcher aucun filtre "Sol",
// meme si la liste attendue est non vide - meme convention que le filtre SQL
// equivalent cote serveur (`inArray`, boulodromesRepository.ts).
function matchesArrayFilter(value: string | null, allowed: string[]): boolean {
    return allowed.length === 0 || (value !== null && allowed.includes(value))
}

function matchesFilters(properties: BoulodromeProperties, filters: BoulodromesPillFilters): boolean {
    return (
        matchesArrayFilter(properties.groundType, filters.groundTypes) &&
        matchesArrayFilter(properties.equipmentType, filters.equipmentTypes) &&
        (filters.freeAccess === undefined || properties.freeAccess === filters.freeAccess)
    )
}

// Fetch par rectangle visible (bbox) plutot que par filtre de pilule (ticket
// 36) : le reseau ne se declenche qu'au changement de bbox (pan/zoom de la
// carte, cf. `setBbox`), les pilules s'appliquent ensuite en memoire sur les
// donnees deja chargees, sans nouveau fetch. Voir
// docs/adr/0004-viewport-bbox-fetching-for-boulodromes-map.md.
export function useBoulodromes(filters: BoulodromesPillFilters): UseBoulodromesResult {
    const [bbox, setBboxState] = useState<Bbox | null>(null)
    const [rawData, setRawData] = useState<BoulodromesFeatureCollection>(EMPTY_COLLECTION)
    const [isFetching, setIsFetching] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Reference stable (pour BoundsWatcher, BoulodromesMap.tsx) qui ignore un
    // bbox inchange (meme rectangle rapporte deux fois par exemple) plutot que
    // de redeclencher un fetch identique au precedent.
    const setBbox = useCallback((next: Bbox) => {
        setBboxState((current) => (current && bboxEqual(current, next) ? current : next))
    }, [])

    useEffect(() => {
        if (!bbox) return

        let cancelled = false

        async function load(bbox: Bbox) {
            setIsFetching(true)
            setError(null)
            try {
                const data = await fetchBoulodromes({ bbox })
                if (cancelled) return
                setRawData(data)
            } catch (err: unknown) {
                if (cancelled) return
                setError(err instanceof Error ? err.message : 'Erreur inconnue')
            } finally {
                if (!cancelled) setIsFetching(false)
            }
        }
        load(bbox)

        return () => {
            cancelled = true
        }
    }, [bbox])

    const features = useMemo<BoulodromesFeatureCollection>(
        () => ({
            type: 'FeatureCollection',
            features: rawData.features.filter((feature) => matchesFilters(feature.properties, filters))
        }),
        [rawData, filters]
    )

    return { features, isFetching, error, setBbox }
}
