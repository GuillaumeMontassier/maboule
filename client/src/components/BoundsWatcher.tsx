import { useCallback, useEffect, useRef } from 'react'
import type L from 'leaflet'
import { useMap, useMapEvent } from 'react-leaflet'
import type { Bbox } from '../api/boulodromes'
import { UI_DEBOUNCE_MS } from '../constants/debounce'

function boundsToBbox(bounds: L.LatLngBounds): Bbox {
    return {
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth()
    }
}

interface BoundsWatcherProps {
    onBoundsChange: (bbox: Bbox) => void
}

// Signale au parent le rectangle actuellement visible (ticket 36, fetch
// bbox-scope) - a chaque pan/zoom (`moveend`), debounce le temps d'un
// deplacement continu, plus un rapport immediat au montage : Leaflet ne
// declenche pas `moveend` pour la vue initiale (aucun mouvement n'a encore eu
// lieu), qui doit pourtant declencher le tout premier chargement.
export function BoundsWatcher({ onBoundsChange }: BoundsWatcherProps) {
    const map = useMap()
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    // `useCallback` (plutot qu'une closure inline passee a `useMapEvent`) :
    // sans reference stable, react-leaflet detache et rattache l'ecouteur
    // Leaflet `moveend` a chaque rendu de ce composant (donc a chaque rendu de
    // `BoulodromesMap`, par exemple au clic sur un marqueur), pas seulement
    // quand `map`/`onBoundsChange` changent reellement.
    const handleMoveEnd = useCallback(() => {
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => onBoundsChange(boundsToBbox(map.getBounds())), UI_DEBOUNCE_MS)
    }, [map, onBoundsChange])

    useMapEvent('moveend', handleMoveEnd)

    useEffect(() => {
        onBoundsChange(boundsToBbox(map.getBounds()))
        return () => clearTimeout(debounceRef.current)
    }, [map, onBoundsChange])

    return null
}
