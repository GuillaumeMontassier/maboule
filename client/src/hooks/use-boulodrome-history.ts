import { useCallback, useState } from 'react'

export interface BoulodromeCoordinates {
    latitude: number
    longitude: number
}

export interface BoulodromeHistoryEntry {
    id: string
    name: string
    siteName: string | null
    coordinates: BoulodromeCoordinates
}

const STORAGE_KEY = 'boulodrome-search-history'
const MAX_ENTRIES = 5

// Deduplique par id (garde la premiere occurrence, donc la plus recente vu
// l'ordre d'appel) et tronque a `MAX_ENTRIES` - applique aussi bien a une
// entree tout juste ajoutee qu'a une lecture depuis localStorage, pour que le
// contenu stocke ne soit jamais tenu pour deja conforme (edite manuellement,
// ecrit par une version differente de l'app, etc.).
function normalizeHistory(entries: BoulodromeHistoryEntry[]): BoulodromeHistoryEntry[] {
    const seen = new Set<string>()
    const deduped: BoulodromeHistoryEntry[] = []
    for (const entry of entries) {
        if (seen.has(entry.id)) continue
        seen.add(entry.id)
        deduped.push(entry)
    }
    return deduped.slice(0, MAX_ENTRIES)
}

function persistHistory(entries: BoulodromeHistoryEntry[]): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch {
        // Best-effort : la persistance echoue silencieusement (quota,
        // navigation privee), l'historique reste utilisable pour la session.
    }
}

function isValidCoordinates(value: unknown): value is BoulodromeCoordinates {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as BoulodromeCoordinates).latitude === 'number' &&
        typeof (value as BoulodromeCoordinates).longitude === 'number'
    )
}

function readStoredHistory(): BoulodromeHistoryEntry[] {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed: unknown = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        const validEntries = parsed
            .filter(
                (entry): entry is Omit<BoulodromeHistoryEntry, 'siteName'> & { siteName?: string | null } =>
                    typeof entry === 'object' &&
                    entry !== null &&
                    typeof (entry as BoulodromeHistoryEntry).id === 'string' &&
                    typeof (entry as BoulodromeHistoryEntry).name === 'string' &&
                    ((entry as BoulodromeHistoryEntry).siteName === undefined ||
                        typeof (entry as BoulodromeHistoryEntry).siteName === 'string' ||
                        (entry as BoulodromeHistoryEntry).siteName === null) &&
                    // Contrairement a `siteName`, `coordinates` n'a pas de valeur par
                    // defaut sensee (ticket 36, necessaire au `flyTo` d'un boulodrome
                    // hors du viewport actuel) : une entree stockee avant son
                    // introduction est ecartee plutot que migree.
                    isValidCoordinates((entry as BoulodromeHistoryEntry).coordinates)
            )
            // Entrees stockees avant l'introduction de `siteName` (ticket 23) n'ont
            // pas ce champ : traitees comme `siteName: null` plutot que rejetees.
            .map((entry) => ({ ...entry, siteName: entry.siteName ?? null }))
        return normalizeHistory(validEntries)
    } catch {
        // localStorage indisponible (navigation privee, quota) ou contenu
        // corrompu : on repart d'un historique vide plutot que de planter.
        return []
    }
}

// Historique des boulodromes recemment selectionnes, affiche au focus du
// champ de recherche quand il est vide. Persiste en localStorage pour
// survivre aux rechargements de page (cf. spec phase 6, ticket 05).
export function useBoulodromeHistory() {
    const [history, setHistory] = useState<BoulodromeHistoryEntry[]>(readStoredHistory)

    const addToHistory = useCallback((entry: BoulodromeHistoryEntry) => {
        setHistory((current) => {
            // `entry` en tete : une entree deja presente dans `current` est donc
            // ecartee par `normalizeHistory` (premiere occurrence gardee) plutot
            // que dupliquee, et remonte de fait en tete.
            const next = normalizeHistory([entry, ...current])
            persistHistory(next)
            return next
        })
    }, [])

    const removeFromHistory = useCallback((id: string) => {
        setHistory((current) => {
            const next = current.filter((entry) => entry.id !== id)
            persistHistory(next)
            return next
        })
    }, [])

    return { history, addToHistory, removeFromHistory }
}
