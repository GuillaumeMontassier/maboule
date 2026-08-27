import type { LeafletMouseEvent } from 'leaflet'
import { useCallback, useEffect, useRef } from 'react'
import { useMapEvent } from 'react-leaflet'

interface MapClickDeselectProps {
    selectedBoulodromeId: string | null
    onDeselect: (id: string) => void
}

// Ferme la Fiche boulodrome (deselection) au clic sur une zone vide de la
// carte. Les marqueurs et tracés interactifs (boulodrome, café, départ,
// polyligne d'itinéraire) propagent eux aussi leur clic vers la carte par
// défaut (`bubblingMouseEvents` Leaflet) - sans le garde ci-dessous, ce
// composant se déclencherait aussi en cliquant l'un d'eux, refermant la fiche
// au moment même où on cherche à l'ouvrir ou à consulter un café à proximité.
// Plutôt que de faire porter ce garde à chaque marqueur/tracé un par un (facile
// à oublier sur un nouveau calque - trouvé en revue de code sur la polyligne
// d'itinéraire), on l'inspecte une seule fois ici via la classe CSS commune
// que Leaflet pose lui-même sur tout calque interactif (`leaflet-interactive`
// - markers et Path confondus), sans avoir besoin de connaître la liste des
// calques existants ni de la tenir à jour pour un futur calque.
//
// `onDeselect` est lu depuis une ref (même principe que `BoundsWatcher` pour
// `onBoundsChange`) : sans ça, react-leaflet détacherait et rattacherait
// l'écouteur Leaflet `click` à chaque changement de sélection, pas
// uniquement quand `map` change réellement.
export function MapClickDeselect({ selectedBoulodromeId, onDeselect }: MapClickDeselectProps) {
    const selectedBoulodromeIdRef = useRef(selectedBoulodromeId)

    useEffect(() => {
        selectedBoulodromeIdRef.current = selectedBoulodromeId
    }, [selectedBoulodromeId])

    const handleClick = useCallback(
        (event: LeafletMouseEvent) => {
            const id = selectedBoulodromeIdRef.current
            if (!id) return
            const clickedTarget = event.originalEvent.target
            if (clickedTarget instanceof Element && clickedTarget.closest('.leaflet-interactive')) return
            onDeselect(id)
        },
        [onDeselect]
    )

    useMapEvent('click', handleClick)

    return null
}
