import L from 'leaflet'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { fetchCafesNearBoulodrome } from '../api/cafes'
import type { CafesFeatureCollection } from '../api/cafes'
import type { BoulodromesFeatureCollection } from '../api/boulodromes'
import { useBoulodromeHistory, type BoulodromeHistoryEntry } from './use-boulodrome-history'

export interface BoulodromeSelection {
    mapRef: RefObject<L.Map | null>
    boulodromeMarkers: RefObject<Map<string, L.Marker>>
    selectedBoulodromeId: string | null
    nearbyCafes: CafesFeatureCollection | null
    history: BoulodromeHistoryEntry[]
    removeFromHistory: (id: string) => void
    selectBoulodrome: (entry: BoulodromeHistoryEntry) => void
    deselectBoulodrome: (id: string) => void
}

// Selection d'un boulodrome sur la carte : id selectionne, cafes a proximite
// charges pour ce boulodrome, historique de recherche alimente, recentrage de
// la carte. Les refs Leaflet necessaires (instance de carte, marqueurs de
// boulodromes) sont creees ici et retournees pour que le composant les passe
// telles quelles aux props `ref` de `MapContainer`/`Marker` - le hook ne
// recree jamais d'instance `L.Map`/`L.Marker` lui-meme, il se contente
// d'appeler leurs methodes (`flyTo`, `openPopup`, `closePopup`) une fois
// peuplees par le rendu Leaflet.
export function useBoulodromeSelection(features: BoulodromesFeatureCollection): BoulodromeSelection {
    const [selectedBoulodromeId, setSelectedBoulodromeId] = useState<string | null>(null)
    const [nearbyCafes, setNearbyCafes] = useState<CafesFeatureCollection | null>(null)
    const boulodromeMarkers = useRef(new Map<string, L.Marker>())
    const mapRef = useRef<L.Map | null>(null)
    const { history, addToHistory, removeFromHistory } = useBoulodromeHistory()

    useEffect(() => {
        if (!selectedBoulodromeId) {
            setNearbyCafes(null)
            return
        }

        let cancelled = false

        async function loadNearbyCafes(boulodromeId: string) {
            try {
                const data = await fetchCafesNearBoulodrome(boulodromeId)
                if (!cancelled) setNearbyCafes(data)
            } catch {
                // Best-effort : un probleme sur les cafes ne doit pas empecher
                // d'afficher la popup du boulodrome lui-meme.
                if (!cancelled) setNearbyCafes(null)
            }
        }
        loadNearbyCafes(selectedBoulodromeId)

        return () => {
            cancelled = true
        }
    }, [selectedBoulodromeId])

    // Rouvre le popup du boulodrome selectionne des que son marqueur devient
    // disponible - necessaire quand la selection vient d'un resultat de
    // recherche/historique hors du bbox actuel (ticket 36) : au moment de la
    // selection, `selectBoulodrome` ci-dessous ne trouve encore aucun
    // marqueur (le `flyTo` qu'elle declenche n'a pas encore fait arriver ce
    // boulodrome dans le bbox charge). Cet effet reessaie a chaque fois que
    // `features` change (nouveau fetch bbox), jusqu'a ce que le marqueur
    // existe enfin.
    useEffect(() => {
        if (!selectedBoulodromeId) return
        const marker = boulodromeMarkers.current.get(selectedBoulodromeId)
        if (marker && !marker.isPopupOpen()) marker.openPopup()
    }, [selectedBoulodromeId, features])

    // Selectionne un boulodrome et ouvre son popup - factorise pour etre
    // declenche aussi bien par un clic sur son marqueur que par le choix d'un
    // resultat de recherche ou d'une entree d'historique (meme etat, meme
    // popup dans les trois cas). Recoit l'entree complete (pas seulement un
    // id) : la recherche interroge l'API sans tenir compte du bbox actuel, et
    // l'historique reference typiquement un boulodrome hors du viewport - un
    // tel resultat peut donc referencer un boulodrome absent de `features`
    // (bbox-scope) et donc sans marqueur sur la carte (ticket 36). Le
    // recentrage (`flyTo`) et l'ajout a l'historique utilisent alors les
    // coordonnees portees par l'entree elle-meme plutot que de dependre d'un
    // marqueur present ; l'ouverture du popup elle-meme reste conditionnee a
    // l'existence du marqueur (rien a ouvrir sinon), mais l'effet ci-dessus
    // reessaie des que le marqueur finit par apparaitre.
    const selectBoulodrome = useCallback(
        (entry: BoulodromeHistoryEntry) => {
            const marker = boulodromeMarkers.current.get(entry.id)
            if (selectedBoulodromeId && selectedBoulodromeId !== entry.id) {
                boulodromeMarkers.current.get(selectedBoulodromeId)?.closePopup()
            }
            setSelectedBoulodromeId(entry.id)
            marker?.openPopup()

            addToHistory(entry)

            // Recentrage anime plutot qu'un saut instantane. Appeler `flyTo` alors
            // qu'une animation precedente est encore en cours ne pose pas de
            // probleme : Leaflet l'interrompt lui-meme en debut d'appel avant de
            // demarrer la nouvelle.
            const map = mapRef.current
            if (map) {
                const currentZoom = map.getZoom()
                const targetZoom = currentZoom >= 15 ? currentZoom : 16
                map.flyTo(L.latLng(entry.coordinates.latitude, entry.coordinates.longitude), targetZoom)
            }
        },
        [addToHistory, selectedBoulodromeId]
    )

    // Ferme la selection courante - utilise par l'evenement `popupclose` du
    // marqueur boulodrome. L'id est verifie avant de vider la selection : un
    // `popupclose` peut arriver pour un marqueur qui n'est deja plus celui
    // selectionne (ex. fermeture explicite de l'ancien popup dans
    // `selectBoulodrome` ci-dessus), auquel cas il ne doit pas ecraser la
    // nouvelle selection.
    const deselectBoulodrome = useCallback((id: string) => {
        setSelectedBoulodromeId((current) => (current === id ? null : current))
    }, [])

    return {
        mapRef,
        boulodromeMarkers,
        selectedBoulodromeId,
        nearbyCafes,
        history,
        removeFromHistory,
        selectBoulodrome,
        deselectBoulodrome
    }
}
