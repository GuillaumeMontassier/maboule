import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import L from 'leaflet'
import { BoulodromesMap } from './BoulodromesMap'
import { fetchCafesNearBoulodrome } from '../api/cafes'
import type { CafesFeatureCollection } from '../api/cafes'
import { fetchBoulodromes } from '../api/boulodromes'
import type { BoulodromesFeatureCollection } from '../api/boulodromes'
import { fetchRoute } from '../api/route'
import type { RouteFeature } from '../api/route'
import { fetchGeocodeCandidates } from '../api/geocode'
import type { GeocodeCandidate } from '../api/geocode'

vi.mock('../api/cafes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../api/cafes')>()),
    fetchCafesNearBoulodrome: vi.fn()
}))

vi.mock('../api/boulodromes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../api/boulodromes')>()),
    fetchBoulodromes: vi.fn()
}))

vi.mock('../api/route', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../api/route')>()),
    fetchRoute: vi.fn()
}))

vi.mock('../api/geocode', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../api/geocode')>()),
    fetchGeocodeCandidates: vi.fn()
}))

const sampleBoulodromes: BoulodromesFeatureCollection = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
            properties: {
                id: 'data-es:1',
                name: 'TERRAIN DE PETANQUE',
                street: '1 rue de Paris',
                postalCode: '75001',
                city: 'Paris',
                inseeCode: null,
                siteName: null,
                equipmentType: null,
                groundType: null,
                freeAccess: null,
                source: 'data-es',
                lastSyncedAt: '2026-07-24T10:00:00.000Z'
            }
        },
        {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [2.36, 48.86] },
            properties: {
                id: 'data-es:2',
                name: 'AUTRE TERRAIN',
                street: '2 rue de Paris',
                postalCode: '75002',
                city: 'Paris',
                inseeCode: null,
                siteName: null,
                equipmentType: null,
                groundType: null,
                freeAccess: null,
                source: 'data-es',
                lastSyncedAt: '2026-07-24T10:00:00.000Z'
            }
        }
    ]
}

const sampleCafes: CafesFeatureCollection = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [2.3523, 48.8567] },
            properties: {
                id: 'osm:1',
                name: 'La Royale',
                amenityType: 'bar',
                street: null,
                postalCode: null,
                city: null,
                source: 'osm',
                lastSyncedAt: '2026-08-06T10:00:00.000Z',
                distanceMeters: 77
            }
        },
        {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [2.3524, 48.8568] },
            properties: {
                id: 'osm:2',
                name: 'Le Rétro',
                amenityType: 'pub',
                street: null,
                postalCode: null,
                city: null,
                source: 'osm',
                lastSyncedAt: '2026-08-06T10:00:00.000Z',
                distanceMeters: 92
            }
        }
    ]
}

const emptyCafes: CafesFeatureCollection = { type: 'FeatureCollection', features: [] }

const sampleRoute: RouteFeature = {
    type: 'Feature',
    geometry: {
        type: 'LineString',
        coordinates: [
            [2.3522, 48.8566],
            [2.353, 48.857]
        ]
    },
    properties: { distanceMeters: 846, durationSeconds: 639 }
}

// jsdom n'implemente pas navigator.geolocation - on la simule pour piloter
// succes/echec depuis les tests, comme on mocke `fetchRoute`/`fetchCafesNearBoulodrome`
// a la frontiere reseau.
function stubGeolocation(behavior: (onSuccess: PositionCallback, onError: PositionErrorCallback | undefined) => void) {
    Object.defineProperty(window.navigator, 'geolocation', {
        configurable: true,
        value: { getCurrentPosition: vi.fn(behavior) }
    })
}

function fakePosition(latitude: number, longitude: number): GeolocationPosition {
    return {
        coords: {
            latitude,
            longitude,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
            toJSON: () => ({})
        },
        timestamp: Date.now(),
        toJSON: () => ({})
    } as GeolocationPosition
}

const singleCandidate: GeocodeCandidate[] = [
    { label: '12 Rue de Rivoli, 75001 Paris', coordinates: { latitude: 48.856, longitude: 2.351 } }
]

const ambiguousCandidates: GeocodeCandidate[] = [
    { label: '12 Rue de Rivoli, 75001 Paris', coordinates: { latitude: 48.856, longitude: 2.351 } },
    { label: '12 Rue de Rivoli, 69001 Lyon', coordinates: { latitude: 45.767, longitude: 4.834 } }
]

afterEach(() => {
    cleanup()
    vi.mocked(fetchCafesNearBoulodrome).mockReset()
    vi.mocked(fetchBoulodromes).mockReset()
    vi.mocked(fetchRoute).mockReset()
    vi.mocked(fetchGeocodeCandidates).mockReset()
    Reflect.deleteProperty(window.navigator, 'geolocation')
    window.localStorage.clear()
})

describe('BoulodromesMap - cafés à proximité', () => {
    it("ne charge aucun café tant qu'aucun boulodrome n'est sélectionné", () => {
        render(<BoulodromesMap features={sampleBoulodromes} />)

        expect(fetchCafesNearBoulodrome).not.toHaveBeenCalled()
    })

    it('charge et affiche les cafés à proximité au clic sur un boulodrome', async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(sampleCafes)

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const [marker] = container.querySelectorAll('.leaflet-marker-icon')

        fireEvent.click(marker)

        await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith('data-es:1'))
        await waitFor(() => expect(container.querySelector('.cafe-marker')).toBeTruthy())
        // sampleCafes contient un bar et un pub : couleurs dédiées attendues,
        // conformes à spec.md (ticket 16).
        expect(container.querySelector('.cafe-marker .bg-purple-500')).toBeTruthy()
        expect(container.querySelector('.cafe-marker .bg-orange-600')).toBeTruthy()
    })

    it('retire les marqueurs cafés du boulodrome précédent quand on en sélectionne un autre', async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValueOnce(sampleCafes).mockResolvedValueOnce(emptyCafes)

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const markers = container.querySelectorAll('.leaflet-marker-icon')

        fireEvent.click(markers[0])
        await waitFor(() => expect(container.querySelector('.cafe-marker')).toBeTruthy())

        fireEvent.click(markers[1])

        await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith('data-es:2'))
        await waitFor(() => expect(container.querySelector('.cafe-marker')).toBeNull())
    })
})

describe('BoulodromesMap - accessibilité clavier', () => {
    it("activer un marqueur au clavier (Entrée) déclenche la même sélection qu'un clic souris", async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const [marker] = container.querySelectorAll('.leaflet-marker-icon')

        // Meme evenement DOM que celui utilise par le mixin popup interne de
        // Leaflet pour ouvrir le popup au clavier (`_onKeyPress`, keyCode 13) -
        // cf. commentaire sur l'ecouteur `keypress` dans BoulodromesMap.tsx.
        fireEvent.keyPress(marker, { key: 'Enter', keyCode: 13 })

        // Les trois effets d'une selection complete (cf. `selectBoulodrome`),
        // absents avant le ticket 13 quand l'activation se faisait au clavier :
        // cafes a proximite charges, panneau Itineraire affiche.
        await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith('data-es:1'))
        expect(await screen.findByRole('heading', { name: 'Itinéraire' })).toBeTruthy()
    })

    it('activer un marqueur au clavier (Espace) déclenche aussi la sélection (role="button", WAI-ARIA attend Entrée et Espace)', async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const [marker] = container.querySelectorAll('.leaflet-marker-icon')

        fireEvent.keyPress(marker, { key: ' ', keyCode: 32 })

        await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith('data-es:1'))
        expect(await screen.findByRole('heading', { name: 'Itinéraire' })).toBeTruthy()
    })

    it("une touche autre qu'Entrée ou Espace sur un marqueur ne déclenche pas de sélection", () => {
        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const [marker] = container.querySelectorAll('.leaflet-marker-icon')

        fireEvent.keyPress(marker, { key: 'a', keyCode: 65 })

        expect(fetchCafesNearBoulodrome).not.toHaveBeenCalled()
    })
})

describe('BoulodromesMap - noms accessibles des marqueurs', () => {
    it("chaque marqueur de boulodrome a un nom accessible distinct (nom du boulodrome, pas l'alt Leaflet par défaut)", () => {
        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const markers = container.querySelectorAll('.leaflet-marker-icon')

        expect(markers[0].getAttribute('alt')).toBe('TERRAIN DE PETANQUE, 1 rue de Paris')
        expect(markers[1].getAttribute('alt')).toBe('AUTRE TERRAIN, 2 rue de Paris')
        expect(markers[0].getAttribute('alt')).not.toBe(markers[1].getAttribute('alt'))
    })

    it('deux boulodromes de name identique mais de siteName/rue différents obtiennent un alt différent (ticket 26)', () => {
        const sameNameDifferentSites: BoulodromesFeatureCollection = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
                    properties: {
                        id: 'data-es:1',
                        name: 'TERRAIN DE PETANQUE',
                        street: '1 rue de Paris',
                        postalCode: '75001',
                        city: 'Paris',
                        inseeCode: null,
                        siteName: 'TEP LOUIS BRAILLE',
                        equipmentType: null,
                        groundType: null,
                        freeAccess: null,
                        source: 'data-es',
                        lastSyncedAt: '2026-07-24T10:00:00.000Z'
                    }
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [2.36, 48.86] },
                    properties: {
                        id: 'data-es:2',
                        name: 'TERRAIN DE PETANQUE',
                        street: '2 rue de Paris',
                        postalCode: '75002',
                        city: 'Paris',
                        inseeCode: null,
                        siteName: 'TEP MENILMONTANT',
                        equipmentType: null,
                        groundType: null,
                        freeAccess: null,
                        source: 'data-es',
                        lastSyncedAt: '2026-07-24T10:00:00.000Z'
                    }
                }
            ]
        }

        const { container } = render(<BoulodromesMap features={sameNameDifferentSites} />)
        const markers = container.querySelectorAll('.leaflet-marker-icon')

        expect(markers[0].getAttribute('alt')).toBe('TERRAIN DE PETANQUE – TEP LOUIS BRAILLE, 1 rue de Paris')
        expect(markers[1].getAttribute('alt')).toBe('TERRAIN DE PETANQUE – TEP MENILMONTANT, 2 rue de Paris')
        expect(markers[0].getAttribute('alt')).not.toBe(markers[1].getAttribute('alt'))
    })

    it('omet la virgule et la rue quand celle-ci est vide plutôt que de laisser une virgule traînante', () => {
        const noStreet: BoulodromesFeatureCollection = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
                    properties: {
                        id: 'data-es:1',
                        name: 'TERRAIN DE PETANQUE',
                        street: '',
                        postalCode: '75001',
                        city: 'Paris',
                        inseeCode: null,
                        siteName: null,
                        equipmentType: null,
                        groundType: null,
                        freeAccess: null,
                        source: 'data-es',
                        lastSyncedAt: '2026-07-24T10:00:00.000Z'
                    }
                }
            ]
        }

        const { container } = render(<BoulodromesMap features={noStreet} />)
        const [marker] = container.querySelectorAll('.leaflet-marker-icon')

        expect(marker.getAttribute('alt')).toBe('TERRAIN DE PETANQUE')
    })

    it("un marqueur de café a un nom accessible (title - alt n'a pas d'effet sur une icône div)", async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(sampleCafes)

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const [marker] = container.querySelectorAll('.leaflet-marker-icon')
        fireEvent.click(marker)

        await waitFor(() => expect(container.querySelector('.cafe-marker')).toBeTruthy())
        expect(container.querySelector('.cafe-marker')?.getAttribute('title')).toBe('La Royale')
    })
})

describe('BoulodromesMap - recherche par mot-clé', () => {
    it('affiche les résultats de recherche après la saisie et la validation', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleBoulodromes)

        render(<BoulodromesMap features={sampleBoulodromes} />)

        fireEvent.change(screen.getByLabelText('Rechercher un boulodrome'), {
            target: { value: 'arsenal' }
        })

        await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledWith({ search: 'arsenal' }))
        expect(await screen.findByText('AUTRE TERRAIN')).toBeTruthy()
    })

    it('sélectionner un résultat de recherche sélectionne le boulodrome correspondant sur la carte', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleBoulodromes)
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)

        render(<BoulodromesMap features={sampleBoulodromes} />)

        fireEvent.change(screen.getByLabelText('Rechercher un boulodrome'), {
            target: { value: 'autre' }
        })

        const result = await screen.findByRole('button', { name: /AUTRE TERRAIN/ })
        fireEvent.click(result)

        // Meme comportement qu'un clic sur le marqueur : chargement des cafes a
        // proximite du boulodrome selectionne, et popup ouverte sur la carte (le
        // code postal n'apparait que dans la popup, pas dans le resultat de
        // recherche - un moyen fiable de verifier qu'elle s'est bien ouverte).
        await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith('data-es:2'))
        expect(await screen.findByText(/75002/)).toBeTruthy()
    })

    it('affiche un message clair quand la recherche ne retourne aucun résultat', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue({ type: 'FeatureCollection', features: [] })

        render(<BoulodromesMap features={sampleBoulodromes} />)

        fireEvent.change(screen.getByLabelText('Rechercher un boulodrome'), {
            target: { value: 'inexistant' }
        })

        expect(await screen.findByText('Aucun boulodrome trouvé.')).toBeTruthy()
    })

    it("sélectionne quand même un résultat de recherche absent de la carte (hors bbox actuel, ticket 36)", async () => {
        // La recherche interroge l'API sans tenir compte du bbox actuellement
        // charge : elle peut renvoyer un boulodrome absent des `features`
        // passées à BoulodromesMap (donc sans marqueur sur la carte). La
        // sélection doit tout de même aboutir (cafés chargés, recentrage) en
        // s'appuyant sur les coordonnées portées par le résultat lui-même,
        // plutôt que d'échouer silencieusement comme avant ce ticket.
        const onlyFirstBoulodrome: BoulodromesFeatureCollection = {
            type: 'FeatureCollection',
            features: [sampleBoulodromes.features[0]]
        }
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleBoulodromes)
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        const flyToSpy = vi.spyOn(L.Map.prototype, 'flyTo')

        render(<BoulodromesMap features={onlyFirstBoulodrome} />)

        fireEvent.change(screen.getByLabelText('Rechercher un boulodrome'), {
            target: { value: 'autre' }
        })

        const result = await screen.findByRole('button', { name: /AUTRE TERRAIN/ })
        fireEvent.click(result)

        await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith('data-es:2'))
        await waitFor(() => expect(flyToSpy).toHaveBeenCalledTimes(1))
        const [latlng] = flyToSpy.mock.calls[0]
        expect((latlng as L.LatLng).lat).toBeCloseTo(48.86)
        expect((latlng as L.LatLng).lng).toBeCloseTo(2.36)

        flyToSpy.mockRestore()
    })

    it("ouvre le popup d'un résultat de recherche hors bbox dès que son marqueur finit par se charger", async () => {
        // Au moment de la sélection, aucun marqueur n'existe encore pour ce
        // boulodrome (hors du bbox initialement charge) : le popup ne peut pas
        // s'ouvrir tout de suite. Une fois qu'un fetch bbox ulterieur (simule
        // ici par un nouveau `features` passe au composant) fait apparaitre son
        // marqueur, le popup doit s'ouvrir de lui-meme plutot que de rester
        // indefiniment ferme (ticket 36).
        const onlyFirstBoulodrome: BoulodromesFeatureCollection = {
            type: 'FeatureCollection',
            features: [sampleBoulodromes.features[0]]
        }
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleBoulodromes)
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)

        const { rerender } = render(<BoulodromesMap features={onlyFirstBoulodrome} />)

        fireEvent.change(screen.getByLabelText('Rechercher un boulodrome'), {
            target: { value: 'autre' }
        })
        const result = await screen.findByRole('button', { name: /AUTRE TERRAIN/ })
        fireEvent.click(result)

        await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith('data-es:2'))
        expect(screen.queryByText(/75002/)).toBeNull()

        rerender(<BoulodromesMap features={sampleBoulodromes} />)

        expect(await screen.findByText(/75002/)).toBeTruthy()
    })
})

// Depuis le ticket 14, les marqueurs de boulodromes portent le nom du
// boulodrome comme nom accessible (au lieu de l'alt Leaflet par defaut
// "Marker") - `getByRole("button", { name })` seul devient donc ambigu des
// qu'un boulodrome de l'historique/des resultats porte le meme nom qu'un
// marqueur affiche sur la carte. Ce helper cible specifiquement l'entree de
// liste (`<li><button>`), jamais le marqueur (qui n'est dans aucun `<ul>`).
function getListButton(name: string): HTMLElement {
    const candidates = screen.getAllByRole('button', { name })
    const match = candidates.find((el) => el.closest('ul'))
    if (!match) throw new Error(`Aucun bouton de liste nomme "${name}" trouve`)
    return match
}

describe('BoulodromesMap - historique de recherche', () => {
    it("sélectionner un boulodrome via son marqueur alimente l'historique affiché au focus du champ de recherche", async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const [marker] = container.querySelectorAll('.leaflet-marker-icon')
        fireEvent.click(marker)
        await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith('data-es:1'))

        const input = screen.getByLabelText('Rechercher un boulodrome')
        fireEvent.focus(input)

        expect(getListButton('TERRAIN DE PETANQUE')).toBeTruthy()
    })

    it("sélectionner un boulodrome via la recherche alimente aussi l'historique", async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleBoulodromes)
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)

        render(<BoulodromesMap features={sampleBoulodromes} />)

        const input = screen.getByLabelText('Rechercher un boulodrome')
        fireEvent.change(input, { target: { value: 'autre' } })
        const result = await screen.findByRole('button', { name: /AUTRE TERRAIN/ })
        fireEvent.click(result)
        await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith('data-es:2'))

        fireEvent.change(input, { target: { value: '' } })
        fireEvent.focus(input)

        expect(getListButton('AUTRE TERRAIN')).toBeTruthy()
    })

    it("cliquer une entrée de l'historique sélectionne directement ce boulodrome sur la carte", async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const markers = container.querySelectorAll('.leaflet-marker-icon')
        fireEvent.click(markers[0])
        await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith('data-es:1'))

        const input = screen.getByLabelText('Rechercher un boulodrome')
        fireEvent.focus(input)
        fireEvent.click(getListButton('TERRAIN DE PETANQUE'))

        await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith('data-es:1'))
        expect(await screen.findByText(/75001/)).toBeTruthy()
    })

    it("l'historique persiste entre deux montages du composant (rechargement de page)", async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)

        const { container, unmount } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const [marker] = container.querySelectorAll('.leaflet-marker-icon')
        fireEvent.click(marker)
        await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith('data-es:1'))
        unmount()

        render(<BoulodromesMap features={sampleBoulodromes} />)
        fireEvent.focus(screen.getByLabelText('Rechercher un boulodrome'))

        expect(getListButton('TERRAIN DE PETANQUE')).toBeTruthy()
    })
})

describe('BoulodromesMap - itinéraire depuis la position GPS', () => {
    it("demande d'itinéraire depuis la position GPS -> tracé affiché", async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        vi.mocked(fetchRoute).mockResolvedValue(sampleRoute)
        stubGeolocation((onSuccess) => onSuccess(fakePosition(48.85, 2.35)))

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const [marker] = container.querySelectorAll('.leaflet-marker-icon')
        fireEvent.click(marker)

        const useLocationButton = await screen.findByRole('button', { name: 'Utiliser ma position' })
        fireEvent.click(useLocationButton)

        await waitFor(() => expect(fetchRoute).toHaveBeenCalledWith('data-es:1', { latitude: 48.85, longitude: 2.35 }))
        await waitFor(() => expect(container.querySelector('.route-start-marker')).toBeTruthy())
        expect(container.querySelector('.route-start-marker .bg-blue-500')).toBeTruthy()
        expect(await screen.findByText(/846 m/)).toBeTruthy()
        // Nom accessible du marqueur de depart d'itineraire (ticket 14) - meme
        // raison qu'un marqueur cafe : icone div, `alt` sans effet, `title` sert
        // de nom accessible de repli.
        expect(container.querySelector('.route-start-marker')?.getAttribute('title')).toBe(
            "Point de départ de l'itinéraire"
        )
    })

    it('permission GPS refusée -> message affiché, aucun appel réseau', async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        stubGeolocation((_onSuccess, onError) => {
            onError?.({
                code: 1,
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3,
                message: 'denied'
            } as GeolocationPositionError)
        })

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const [marker] = container.querySelectorAll('.leaflet-marker-icon')
        fireEvent.click(marker)

        const useLocationButton = await screen.findByRole('button', { name: 'Utiliser ma position' })
        fireEvent.click(useLocationButton)

        expect(await screen.findByText(/Géolocalisation refusée/)).toBeTruthy()
        expect(fetchRoute).not.toHaveBeenCalled()
    })

    it('changement de boulodrome sélectionné -> tracé retiré', async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        vi.mocked(fetchRoute).mockResolvedValue(sampleRoute)
        stubGeolocation((onSuccess) => onSuccess(fakePosition(48.85, 2.35)))

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const markers = container.querySelectorAll('.leaflet-marker-icon')

        fireEvent.click(markers[0])
        fireEvent.click(await screen.findByRole('button', { name: 'Utiliser ma position' }))
        await waitFor(() => expect(container.querySelector('.route-start-marker')).toBeTruthy())

        fireEvent.click(markers[1])

        await waitFor(() => expect(container.querySelector('.route-start-marker')).toBeNull())
    })

    it("une réponse d'itinéraire tardive pour le boulodrome précédent n'écrase pas la sélection actuelle", async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        let resolvePendingRoute: ((route: RouteFeature) => void) | undefined
        vi.mocked(fetchRoute).mockImplementationOnce(() => new Promise((resolve) => (resolvePendingRoute = resolve)))
        stubGeolocation((onSuccess) => onSuccess(fakePosition(48.85, 2.35)))

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const markers = container.querySelectorAll('.leaflet-marker-icon')

        fireEvent.click(markers[0])
        fireEvent.click(await screen.findByRole('button', { name: 'Utiliser ma position' }))
        await waitFor(() => expect(fetchRoute).toHaveBeenCalledWith('data-es:1', { latitude: 48.85, longitude: 2.35 }))

        // Changement de boulodrome avant que la requete du premier ne resolve -
        // le panneau "data-es:1" est demonte (remplace par celui de "data-es:2").
        fireEvent.click(markers[1])
        await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith('data-es:2'))

        // La reponse tardive de "data-es:1" ne doit pas redessiner son trace
        // maintenant que "data-es:2" est selectionne (course entre l'ancienne
        // instance de RoutePanel et sa reponse reseau en vol).
        await act(async () => resolvePendingRoute?.(sampleRoute))

        expect(container.querySelector('.route-start-marker')).toBeNull()
    })

    it('une erreur de géolocalisation après un itinéraire déjà affiché retire le tracé', async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        vi.mocked(fetchRoute).mockResolvedValue(sampleRoute)
        stubGeolocation((onSuccess) => onSuccess(fakePosition(48.85, 2.35)))

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const [marker] = container.querySelectorAll('.leaflet-marker-icon')
        fireEvent.click(marker)

        const useLocationButton = await screen.findByRole('button', { name: 'Utiliser ma position' })
        fireEvent.click(useLocationButton)
        await waitFor(() => expect(container.querySelector('.route-start-marker')).toBeTruthy())

        // Deuxieme demande (ex. rafraichissement de position), cette fois en echec.
        stubGeolocation((_onSuccess, onError) => {
            onError?.({
                code: 1,
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3,
                message: 'denied'
            } as GeolocationPositionError)
        })
        fireEvent.click(useLocationButton)

        await waitFor(() => expect(container.querySelector('.route-start-marker')).toBeNull())
        expect(await screen.findByText(/Géolocalisation refusée/)).toBeTruthy()
    })
})

describe('BoulodromesMap - itinéraire depuis une adresse recherchée', () => {
    async function selectBoulodromeAndSearchAddress(container: HTMLElement, query: string) {
        const [marker] = container.querySelectorAll('.leaflet-marker-icon')
        fireEvent.click(marker)

        fireEvent.change(await screen.findByLabelText('Adresse de départ'), {
            target: { value: query }
        })
        fireEvent.click(screen.getByRole('button', { name: "Rechercher l'adresse" }))
    }

    it('adresse avec un seul résultat -> itinéraire affiché directement', async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        vi.mocked(fetchGeocodeCandidates).mockResolvedValue(singleCandidate)
        vi.mocked(fetchRoute).mockResolvedValue(sampleRoute)

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        await selectBoulodromeAndSearchAddress(container, '12 rue de rivoli')

        await waitFor(() =>
            expect(fetchRoute).toHaveBeenCalledWith('data-es:1', { latitude: 48.856, longitude: 2.351 })
        )
        await waitFor(() => expect(container.querySelector('.route-start-marker')).toBeTruthy())
        expect(await screen.findByText(/846 m/)).toBeTruthy()
    })

    it('adresse ambiguë -> liste de choix affichée puis sélection -> itinéraire affiché', async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        vi.mocked(fetchGeocodeCandidates).mockResolvedValue(ambiguousCandidates)
        vi.mocked(fetchRoute).mockResolvedValue(sampleRoute)

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        await selectBoulodromeAndSearchAddress(container, '12 rue de rivoli')

        expect(fetchRoute).not.toHaveBeenCalled()
        const lyonOption = await screen.findByRole('button', { name: /69001 Lyon/ })

        fireEvent.click(lyonOption)

        await waitFor(() =>
            expect(fetchRoute).toHaveBeenCalledWith('data-es:1', { latitude: 45.767, longitude: 4.834 })
        )
        expect(await screen.findByText(/846 m/)).toBeTruthy()
    })

    it('adresse sans résultat -> message affiché', async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        vi.mocked(fetchGeocodeCandidates).mockRejectedValue(
            new Error('Aucune adresse ne correspond à cette recherche.')
        )

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        await selectBoulodromeAndSearchAddress(container, 'adresse inexistante')

        expect(await screen.findByText(/Aucune adresse ne correspond/)).toBeTruthy()
        expect(fetchRoute).not.toHaveBeenCalled()
    })

    it("une nouvelle recherche d'adresse ambiguë retire le tracé déjà affiché en attendant un choix", async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        vi.mocked(fetchGeocodeCandidates)
            .mockResolvedValueOnce(singleCandidate)
            .mockResolvedValueOnce(ambiguousCandidates)
        vi.mocked(fetchRoute).mockResolvedValue(sampleRoute)

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        await selectBoulodromeAndSearchAddress(container, '12 rue de rivoli')
        await waitFor(() => expect(container.querySelector('.route-start-marker')).toBeTruthy())

        // Deuxieme recherche, cette fois ambigue : le trace de la premiere
        // adresse (deja affiche) ne doit pas rester sur la carte pendant que
        // l'utilisateur choisit parmi les candidats de la seconde recherche.
        fireEvent.change(screen.getByLabelText('Adresse de départ'), {
            target: { value: '12 rue de rivoli' }
        })
        fireEvent.click(screen.getByRole('button', { name: "Rechercher l'adresse" }))

        await screen.findByRole('button', { name: /69001 Lyon/ })
        expect(container.querySelector('.route-start-marker')).toBeNull()
    })
})

describe('BoulodromesMap - recentrage automatique', () => {
    // `flyTo` retombe sur un `setView` synchrone en l'absence de support
    // CSS3D (cas de jsdom) - pas besoin d'attendre une animation dans les
    // tests, seuls les arguments de l'appel nous interessent ici.
    it('clique sur un marqueur -> anime la carte (flyTo) vers ses coordonnées avec le zoom monté à 16', async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        const flyToSpy = vi.spyOn(L.Map.prototype, 'flyTo')

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const [marker] = container.querySelectorAll('.leaflet-marker-icon')
        fireEvent.click(marker)

        await waitFor(() => expect(flyToSpy).toHaveBeenCalledTimes(1))
        const [latlng, zoom] = flyToSpy.mock.calls[0]
        expect((latlng as L.LatLng).lat).toBeCloseTo(48.8566)
        expect((latlng as L.LatLng).lng).toBeCloseTo(2.3522)
        // Zoom initial de la carte (12) < 15 -> monte a 16.
        expect(zoom).toBe(16)

        flyToSpy.mockRestore()
    })

    it("conserve le zoom courant s'il est déjà >= 15 lors du recentrage", async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        const flyToSpy = vi.spyOn(L.Map.prototype, 'flyTo')

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const markers = container.querySelectorAll('.leaflet-marker-icon')

        // Zoom initial 12 -> 15 via les boutons de zoom (le controle de zoom par
        // defaut de Leaflet, encore en place pour cette phase - repositionne au
        // ticket 07).
        const zoomInButton = container.querySelector<HTMLElement>('.leaflet-control-zoom-in')
        if (!zoomInButton) throw new Error('bouton zoom-in introuvable')
        fireEvent.click(zoomInButton)
        fireEvent.click(zoomInButton)
        fireEvent.click(zoomInButton)

        fireEvent.click(markers[0])

        await waitFor(() => expect(flyToSpy).toHaveBeenCalledTimes(1))
        const [, zoom] = flyToSpy.mock.calls[0]
        expect(zoom).toBe(15)

        flyToSpy.mockRestore()
    })

    it("sélectionner un boulodrome depuis la recherche déclenche le même recentrage qu'un clic sur son marqueur", async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleBoulodromes)
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        const flyToSpy = vi.spyOn(L.Map.prototype, 'flyTo')

        render(<BoulodromesMap features={sampleBoulodromes} />)

        fireEvent.change(screen.getByLabelText('Rechercher un boulodrome'), {
            target: { value: 'autre' }
        })
        const result = await screen.findByRole('button', { name: /AUTRE TERRAIN/ })
        fireEvent.click(result)

        await waitFor(() => expect(flyToSpy).toHaveBeenCalledTimes(1))
        const [latlng, zoom] = flyToSpy.mock.calls[0]
        expect((latlng as L.LatLng).lat).toBeCloseTo(48.86)
        expect((latlng as L.LatLng).lng).toBeCloseTo(2.36)
        expect(zoom).toBe(16)

        flyToSpy.mockRestore()
    })

    it("changer de boulodrome sélectionné pendant qu'une animation est en cours ne laisse pas la carte dans un état incohérent", async () => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        const flyToSpy = vi.spyOn(L.Map.prototype, 'flyTo')

        const { container } = render(<BoulodromesMap features={sampleBoulodromes} />)
        const markers = container.querySelectorAll('.leaflet-marker-icon')

        // Deuxieme clic avant meme d'attendre la resolution du premier - Leaflet
        // interrompt lui-meme l'animation en cours au debut de chaque `flyTo`.
        fireEvent.click(markers[0])
        fireEvent.click(markers[1])

        await waitFor(() => expect(flyToSpy).toHaveBeenCalledTimes(2))
        const [lastLatLng] = flyToSpy.mock.calls[1]
        expect((lastLatLng as L.LatLng).lat).toBeCloseTo(48.86)
        expect((lastLatLng as L.LatLng).lng).toBeCloseTo(2.36)
        expect(await screen.findByText(/75002/)).toBeTruthy()

        flyToSpy.mockRestore()
    })
})

describe('BoulodromesMap - chargement par viewport (bbox, ticket 36)', () => {
    it('signale le bbox de la vue initiale des le montage (Leaflet ne déclenche pas moveend pour elle)', () => {
        const initialBounds = L.latLngBounds([48.8, 2.2], [48.9, 2.5])
        const getBoundsSpy = vi.spyOn(L.Map.prototype, 'getBounds').mockReturnValue(initialBounds)
        const onBoundsChange = vi.fn()

        render(<BoulodromesMap features={sampleBoulodromes} onBoundsChange={onBoundsChange} />)

        expect(onBoundsChange).toHaveBeenCalledExactlyOnceWith({ west: 2.2, south: 48.8, east: 2.5, north: 48.9 })

        getBoundsSpy.mockRestore()
    })

    it('ne plante pas quand onBoundsChange n’est pas fourni (BoundsWatcher non monté)', () => {
        // Verifie l'absence d'erreur (BoundsWatcher non monte du tout) plutot
        // qu'un comportement observable specifique.
        expect(() => render(<BoulodromesMap features={sampleBoulodromes} />)).not.toThrow()
    })

    it('debounce les rapports successifs de moveend (UI_DEBOUNCE_MS, partagé avec BoulodromeSearch.tsx)', () => {
        vi.useFakeTimers()
        const boundsAtMount = L.latLngBounds([48.8, 2.2], [48.9, 2.5])
        const boundsAfterMove = L.latLngBounds([48.81, 2.21], [48.91, 2.51])
        const getBoundsSpy = vi.spyOn(L.Map.prototype, 'getBounds').mockReturnValue(boundsAtMount)
        const onSpy = vi.spyOn(L.Map.prototype, 'on')
        const onBoundsChange = vi.fn()

        render(<BoulodromesMap features={sampleBoulodromes} onBoundsChange={onBoundsChange} />)
        expect(onBoundsChange).toHaveBeenCalledTimes(1)

        const onCalls = onSpy.mock.calls as unknown as [string, () => void][]
        const moveendHandler = onCalls.find(([type]) => type === 'moveend')?.[1]
        if (!moveendHandler) throw new Error('gestionnaire moveend introuvable')

        getBoundsSpy.mockReturnValue(boundsAfterMove)
        // Deux `moveend` rapproches (deplacement continu) : un seul rapport au
        // parent apres le silence, pas un par evenement.
        moveendHandler()
        moveendHandler()

        vi.advanceTimersByTime(299)
        expect(onBoundsChange).toHaveBeenCalledTimes(1)

        vi.advanceTimersByTime(1)
        expect(onBoundsChange).toHaveBeenCalledTimes(2)
        expect(onBoundsChange).toHaveBeenLastCalledWith({ west: 2.21, south: 48.81, east: 2.51, north: 48.91 })

        vi.useRealTimers()
        getBoundsSpy.mockRestore()
        onSpy.mockRestore()
    })
})
