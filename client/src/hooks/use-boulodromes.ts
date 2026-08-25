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

// Distingue le tout premier chargement (bloquant : aucune donnee a montrer
// tant qu'il n'a pas reussi au moins une fois) d'un rechargement en
// arriere-plan (pan/zoom apres un premier succes) - ticket 37, corrige le
// clignotement du ticket 36 ou les deux etaient confondus sous un seul
// `isFetching`. `status: 'ready'` signifie "au moins un succes a eu lieu" :
// un rechargement ulterieur y reste (`isRefetching`/`refetchError`), meme
// s'il echoue - contrairement a un echec du tout premier chargement, qui
// repasse en `initial-error` (toujours rien a montrer).
export type BoulodromesState =
    | { status: 'initial-loading' }
    | { status: 'initial-error'; message: string }
    | { status: 'ready'; isRefetching: boolean; refetchError: string | null }

export interface BoulodromesStatusDisplay {
    // `null` signifie "rien a afficher" (rechargement reussi ou silencieux) -
    // distinct d'une chaine vide, qui reste un message a afficher (cas limite
    // d'une erreur au message vide).
    message: string | null
    isError: boolean
}

// Traduit `BoulodromesState` en ce qu'il faut montrer a l'utilisateur -
// colocalisee avec le type plutot que dispersee en ternaires chez l'appelant
// (App.tsx), pour que les deux evoluent ensemble. Le `switch` sans `default`
// est volontaire : TypeScript signale une erreur de compilation si un
// variant de `BoulodromesState` n'est pas gere (le type de retour ne peut
// pas etre satisfait sur tous les chemins), ce qui force a mettre a jour
// cette fonction des qu'un variant est ajoute/retire.
export function describeBoulodromesState(state: BoulodromesState): BoulodromesStatusDisplay {
    switch (state.status) {
        case 'initial-loading':
            return { message: 'Chargement des boulodromes…', isError: false }
        case 'initial-error':
            return { message: state.message, isError: true }
        case 'ready':
            return { message: state.refetchError, isError: state.refetchError !== null }
    }
}

export interface UseBoulodromesResult {
    // Donnees du bbox actuel, filtrees en memoire par les pilules - jamais
    // videes pendant un rechargement (cf. `state` ci-dessous), pour garder
    // les marqueurs deja charges affiches sans clignotement.
    features: BoulodromesFeatureCollection
    state: BoulodromesState
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
    const [state, setState] = useState<BoulodromesState>({ status: 'initial-loading' })

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
            // `status === 'ready'` signifie "au moins un succes a deja eu lieu" -
            // ce test (plutot qu'un flag separe ou `rawData.features.length`, qui
            // vaut aussi 0 pour un bbox legitimement vide) est ce qui distingue un
            // rechargement en arriere-plan du tout premier chargement.
            setState((current) =>
                current.status === 'ready' ? { ...current, isRefetching: true } : { status: 'initial-loading' }
            )
            try {
                const data = await fetchBoulodromes({ bbox })
                if (cancelled) return
                setRawData(data)
                setState({ status: 'ready', isRefetching: false, refetchError: null })
            } catch (err: unknown) {
                if (cancelled) return
                const message = err instanceof Error ? err.message : 'Erreur inconnue'
                setState((current) =>
                    current.status === 'ready'
                        ? { status: 'ready', isRefetching: false, refetchError: message }
                        : { status: 'initial-error', message }
                )
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

    return { features, state, setBbox }
}
