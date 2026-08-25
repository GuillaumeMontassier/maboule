import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { fetchRoute, type RouteFeature } from '../api/route'
import { fetchGeocodeCandidates, type GeocodeCandidate } from '../api/geocode'
import { FOCUS_RING_CLASS, FOCUS_RING_INSET_CLASS } from './focusStyles'
import { FLOATING_SURFACE_CLASS } from './surfaceStyles'

type RouteState =
    | { status: 'idle' }
    | { status: 'locating' }
    | { status: 'geocoding' }
    | { status: 'choosing'; candidates: GeocodeCandidate[] }
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'success'; route: RouteFeature }

interface RoutePanelProps {
    boulodromeId: string
    onRouteChange: (route: RouteFeature | null) => void
}

function geolocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            return "Géolocalisation refusée. Autorisez l'accès à votre position pour utiliser cette option."
        case error.POSITION_UNAVAILABLE:
            return "Votre position n'a pas pu être déterminée."
        case error.TIMEOUT:
            return 'La récupération de votre position a pris trop de temps.'
        default:
            return 'Impossible de récupérer votre position.'
    }
}

function formatDistance(distanceMeters: number): string {
    if (distanceMeters >= 1000) return `${(distanceMeters / 1000).toFixed(1)} km`
    return `${Math.round(distanceMeters)} m`
}

function formatDuration(durationSeconds: number): string {
    const minutes = Math.round(durationSeconds / 60)
    return `${minutes} min`
}

export function RoutePanel({ boulodromeId, onRouteChange }: RoutePanelProps) {
    const [state, setState] = useState<RouteState>({ status: 'idle' })
    const [addressQuery, setAddressQuery] = useState('')
    // Le panneau est remonte (nouvelle instance, cf. `key` cote appelant) des
    // qu'un autre boulodrome est selectionne, mais les callbacks async de la
    // requete en cours pour l'ANCIENNE instance (geolocalisation, fetchRoute)
    // continuent de s'executer independamment du cycle de vie React - rien ne
    // les annule. Sans ce garde, une reponse tardive appellerait `onRouteChange`
    // (= `setRoute` sur BoulodromesMap, toujours monte) et redessinerait sur la
    // carte le trace de l'ancien boulodrome alors qu'un autre est maintenant
    // affiche dans le panneau.
    const isCurrent = useRef(true)

    useEffect(() => {
        isCurrent.current = true
        return () => {
            isCurrent.current = false
            onRouteChange(null)
        }
    }, [onRouteChange])

    // Partage entre le flux GPS et le flux adresse : les deux finissent par un
    // point de depart resolu en coordonnees, a partir duquel le calcul
    // d'itineraire et sa gestion d'etat (loading/succes/erreur) sont identiques.
    function requestRoute(from: { latitude: number; longitude: number }) {
        setState({ status: 'loading' })
        fetchRoute(boulodromeId, from)
            .then((route) => {
                if (!isCurrent.current) return
                setState({ status: 'success', route })
                onRouteChange(route)
            })
            .catch((error: unknown) => {
                if (!isCurrent.current) return
                const message = error instanceof Error ? error.message : 'Erreur inconnue'
                setState({ status: 'error', message })
                onRouteChange(null)
            })
    }

    function handleUseMyLocation() {
        // Permission refusee ou geolocalisation non disponible : gere
        // entierement cote frontend, aucun appel reseau declenche (cf. spec).
        if (!('geolocation' in navigator)) {
            setState({
                status: 'error',
                message: "La géolocalisation n'est pas disponible sur cet appareil."
            })
            return
        }

        setState({ status: 'locating' })
        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (!isCurrent.current) return
                requestRoute({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                })
            },
            (error) => {
                if (!isCurrent.current) return
                setState({ status: 'error', message: geolocationErrorMessage(error) })
                // Efface un trace deja affiche (ex. rafraichissement de position qui
                // echoue apres un premier calcul reussi) - le panneau et la carte ne
                // doivent pas se retrouver en desaccord sur l'existence d'un trace.
                onRouteChange(null)
            },
            // Sans timeout, un appareil qui ne renvoie jamais de position (pas de
            // fix GPS, prompt de permission bloque) laisserait "locating" indefini
            // - ce qui, `busy` desactivant aussi le formulaire d'adresse, prive
            // l'utilisateur du repli par adresse que ce champ existe justement pour
            // offrir. Le code gerait deja ce cas cote message (`TIMEOUT` ci-dessus)
            // mais rien ne le declenchait avant.
            { timeout: 10_000 }
        )
    }

    function handleAddressSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const trimmed = addressQuery.trim()
        if (!trimmed) return

        setState({ status: 'geocoding' })
        fetchGeocodeCandidates(trimmed)
            .then((candidates) => {
                if (!isCurrent.current) return
                // Un seul candidat : pas d'ambiguite, on calcule directement
                // l'itineraire plutot que de faire choisir l'utilisateur parmi une
                // liste a un seul element (cf. spec).
                if (candidates.length === 1) {
                    requestRoute(candidates[0].coordinates)
                    return
                }
                setState({ status: 'choosing', candidates })
                // Efface un trace deja affiche (ex. nouvelle recherche d'adresse
                // apres un premier itineraire reussi) - meme raisonnement que sur
                // l'echec de geolocalisation ci-dessus : le panneau (en attente d'un
                // choix) et la carte (trace de l'ancienne adresse) ne doivent pas se
                // retrouver en desaccord.
                onRouteChange(null)
            })
            .catch((error: unknown) => {
                if (!isCurrent.current) return
                // Couvre aussi bien "aucun resultat" (404 -> message d'erreur cote
                // fetchGeocodeCandidates) qu'une panne du service de geocodage.
                const message = error instanceof Error ? error.message : 'Erreur inconnue'
                setState({ status: 'error', message })
                onRouteChange(null)
            })
    }

    function handleSelectCandidate(candidate: GeocodeCandidate) {
        requestRoute(candidate.coordinates)
    }

    const busy = state.status === 'locating' || state.status === 'loading' || state.status === 'geocoding'

    return (
        // Meme largeur (280px) et meme marge (12px) que la barre de recherche et
        // les filtres (cf. `constants/routePanelLayout.ts`, partage avec
        // BoulodromesMap), mais `max-w` reduit la largeur reelle plutot que de
        // chevaucher les controles de zoom (bas-droite) sur les ecrans les plus
        // etroits (< ~376px de large, ou 280px + les deux marges de 12px
        // depassent l'espace disponible avant ces controles).
        <div
            className={`fixed bottom-3 left-3 z-[1000] w-[280px] max-w-[calc(100vw-96px)] px-3 py-2.5 font-sans text-sm ${FLOATING_SURFACE_CLASS}`}
        >
            <h2 className="mb-2 text-base">Itinéraire</h2>
            <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={busy}
                className={`w-full cursor-pointer rounded-md border border-gray-300 bg-gray-100 px-2 py-1.5 disabled:cursor-default disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 ${FOCUS_RING_CLASS}`}
            >
                Utiliser ma position
            </button>
            <p className="my-2 text-center text-[0.85em] text-gray-500 dark:text-gray-400">ou</p>
            <form onSubmit={handleAddressSubmit} className="flex gap-1.5">
                <input
                    type="search"
                    aria-label="Adresse de départ"
                    placeholder="Rechercher une adresse de départ…"
                    value={addressQuery}
                    onChange={(event) => setAddressQuery(event.target.value)}
                    disabled={busy}
                    className={`min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1.5 dark:border-gray-600 dark:bg-gray-700 dark:placeholder-gray-400 ${FOCUS_RING_CLASS}`}
                />
                <button
                    type="submit"
                    disabled={busy}
                    aria-label="Rechercher l'adresse"
                    title="Rechercher l'adresse"
                    className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-gray-100 disabled:cursor-default disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 ${FOCUS_RING_CLASS}`}
                >
                    <Search size={16} />
                </button>
            </form>
            {state.status === 'locating' && <p className="mt-2">Récupération de votre position…</p>}
            {state.status === 'geocoding' && <p className="mt-2">Recherche de l'adresse…</p>}
            {state.status === 'loading' && <p className="mt-2">Calcul de l'itinéraire…</p>}
            {state.status === 'error' && <p className="mt-2 text-red-700 dark:text-red-400">{state.message}</p>}
            {state.status === 'choosing' && (
                <ul className="mt-2 max-h-40 list-none divide-y divide-gray-200 overflow-y-auto rounded-md border border-gray-300 dark:divide-gray-700 dark:border-gray-600">
                    {state.candidates.map((candidate) => (
                        <li
                            key={`${candidate.label}-${candidate.coordinates.latitude}-${candidate.coordinates.longitude}`}
                        >
                            <button
                                type="button"
                                onClick={() => handleSelectCandidate(candidate)}
                                className={`block w-full cursor-pointer px-2 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${FOCUS_RING_INSET_CLASS}`}
                            >
                                {candidate.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {state.status === 'success' && (
                <p className="mt-2">
                    {formatDistance(state.route.properties.distanceMeters)} ·{' '}
                    {formatDuration(state.route.properties.durationSeconds)} à pied
                </p>
            )}
        </div>
    )
}
