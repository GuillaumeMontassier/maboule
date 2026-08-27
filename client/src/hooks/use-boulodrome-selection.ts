import L from 'leaflet'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { fetchCafesNearBoulodrome } from '../api/cafes'
import type { CafesFeatureCollection } from '../api/cafes'
import type { BoulodromesFeatureCollection } from '../api/boulodromes'
import { useBoulodromeHistory, type BoulodromeHistoryEntry } from './use-boulodrome-history'

export interface BoulodromeSelection {
    mapRef: RefObject<L.Map | null>
    selectedBoulodromeId: string | null
    nearbyCafes: CafesFeatureCollection | null
    history: BoulodromeHistoryEntry[]
    removeFromHistory: (id: string) => void
    selectBoulodrome: (entry: BoulodromeHistoryEntry) => void
    deselectBoulodrome: (id: string) => void
}

// Selection d'un boulodrome sur la carte : id selectionne, cafes a proximite
// charges pour ce boulodrome, historique de recherche alimente, recentrage de
// la carte (Fiche boulodrome et RoutePanel affiches par le composant
// appelant, pilotes uniquement par `selectedBoulodromeId`). La ref Leaflet de
// la carte est creee ici et retournee pour que le composant la passe telle
// quelle a la prop `ref` de `MapContainer` - le hook ne recree jamais
// d'instance `L.Map` lui-meme, il se contente d'appeler `flyTo` une fois
// peuplee par le rendu Leaflet.
export function useBoulodromeSelection(features: BoulodromesFeatureCollection): BoulodromeSelection {
    const [selectedBoulodromeId, setSelectedBoulodromeId] = useState<string | null>(null)
    const [nearbyCafes, setNearbyCafes] = useState<CafesFeatureCollection | null>(null)
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
                // Exception assumee a la regle des 3 etats (chargement/erreur/succes) :
                // la popup boulodrome ne doit jamais dependre de la disponibilite des
                // cafes, qui ne sont qu'une information secondaire affichee dessus.
                // Une erreur retombe donc silencieusement sur `null` (etat "aucun cafe"),
                // sans etat "erreur" distinct expose a l'utilisateur - decision tranchee
                // au ticket 05 (.scratch/phase-8-standards/issues/05-etat-erreur-cafes-proximite.md)
                // plutot que laissee comme un oubli.
                if (!cancelled) setNearbyCafes(null)
            }
        }
        loadNearbyCafes(selectedBoulodromeId)

        return () => {
            cancelled = true
        }
    }, [selectedBoulodromeId])

    // Selectionne un boulodrome - factorise pour etre declenche aussi bien par
    // un clic sur son marqueur que par le choix d'un resultat de recherche ou
    // d'une entree d'historique (meme etat dans les trois cas). Recoit
    // l'entree complete (pas seulement un id) : la recherche interroge l'API
    // sans tenir compte du bbox actuel, et l'historique reference typiquement
    // un boulodrome hors du viewport - un tel resultat peut donc referencer un
    // boulodrome absent de `features` (bbox-scope, ticket 36). Le recentrage
    // (`flyTo`) et l'ajout a l'historique utilisent alors les coordonnees
    // portees par l'entree elle-meme plutot que de dependre d'un marqueur
    // present. La Fiche boulodrome, elle, reste conditionnee a l'existence du
    // boulodrome dans `features` (rien a afficher sinon, cf. composant
    // appelant) - elle apparait d'elle-meme des qu'un fetch bbox ulterieur
    // fait apparaitre ce boulodrome, aucun effet dedie necessaire ici (a la
    // difference de l'ancien mecanisme de popup Leaflet, qui devait reessayer
    // d'ouvrir un popup une fois le marqueur disponible).
    const selectBoulodrome = useCallback(
        (entry: BoulodromeHistoryEntry) => {
            setSelectedBoulodromeId(entry.id)
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
        [addToHistory]
    )

    // Ferme la selection courante (Fiche boulodrome, RoutePanel, cafes a
    // proximite) - utilise par les trois chemins de fermeture de la Fiche
    // (bouton "x", clic sur une zone vide de la carte, touche Echap). L'id est
    // verifie avant de vider la selection : un appel peut concerner un
    // boulodrome qui n'est deja plus celui selectionne (ex. une nouvelle
    // selection a eu lieu entre-temps), auquel cas il ne doit pas ecraser la
    // nouvelle selection.
    const deselectBoulodrome = useCallback((id: string) => {
        setSelectedBoulodromeId((current) => (current === id ? null : current))
    }, [])

    // Lu par l'ecouteur Echap ci-dessous - ref (pas une dependance d'effet)
    // pour ne pas detacher/rattacher l'ecouteur `keydown` a chaque changement
    // de selection, meme principe que la ref de `MapClickDeselect` pour
    // `onDeselect` (trouve en revue de code : l'effet se recreait sans
    // necessite reelle a chaque selection/deselection).
    const selectedBoulodromeIdRef = useRef(selectedBoulodromeId)
    useEffect(() => {
        selectedBoulodromeIdRef.current = selectedBoulodromeId
    }, [selectedBoulodromeId])

    // Ferme la Fiche a la touche Echap - ecouteur document (pas seulement sur
    // la fiche/le marqueur) pour rester coherent avec la fermeture au clic
    // sur une zone vide de la carte, utilisable quel que soit l'element
    // actuellement focalise. Exception : un champ de saisie focalise (ex.
    // adresse de depart du RoutePanel, ou sa liste de candidats en cours de
    // choix) ignore Echap ici - Echap y signifie "annuler la saisie en
    // cours", pas "fermer toute la fiche et perdre la recherche d'itineraire
    // en amont" (trouve en revue de code).
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Escape') return
            const currentId = selectedBoulodromeIdRef.current
            if (!currentId) return
            const activeTag = document.activeElement?.tagName
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return
            deselectBoulodrome(currentId)
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [deselectBoulodrome])

    return {
        mapRef,
        selectedBoulodromeId,
        nearbyCafes,
        history,
        removeFromHistory,
        selectBoulodrome,
        deselectBoulodrome
    }
}
