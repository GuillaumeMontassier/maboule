import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type L from 'leaflet'
import { useBoulodromeSelection } from './use-boulodrome-selection'
import { fetchCafesNearBoulodrome } from '../api/cafes'
import type { CafesFeatureCollection } from '../api/cafes'
import type { BoulodromesFeatureCollection } from '../api/boulodromes'
import type { BoulodromeHistoryEntry } from './use-boulodrome-history'

vi.mock('../api/cafes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../api/cafes')>()),
    fetchCafesNearBoulodrome: vi.fn()
}))

const emptyFeatures: BoulodromesFeatureCollection = { type: 'FeatureCollection', features: [] }

const emptyCafes: CafesFeatureCollection = { type: 'FeatureCollection', features: [] }

const ARSENAL: BoulodromeHistoryEntry = {
    id: 'data-es:1',
    name: 'ARSENAL',
    siteName: null,
    coordinates: { latitude: 48.8494, longitude: 2.3688 }
}

const VINCENNES: BoulodromeHistoryEntry = {
    id: 'data-es:2',
    name: 'VINCENNES',
    siteName: null,
    coordinates: { latitude: 48.8286, longitude: 2.4372 }
}

// Un marqueur Leaflet n'a besoin, du point de vue du hook, que des trois
// methodes qu'il appelle reellement (`openPopup`/`closePopup`/`isPopupOpen`) -
// ce double suffit donc a tester la logique de selection sans monter de
// carte Leaflet reelle (cf. commentaire du hook sur les refs "retournees, pas
// recreees").
function fakeMarker(): L.Marker {
    let popupOpen = false
    return {
        openPopup: vi.fn(() => {
            popupOpen = true
        }),
        closePopup: vi.fn(() => {
            popupOpen = false
        }),
        isPopupOpen: vi.fn(() => popupOpen)
    } as unknown as L.Marker
}

function fakeMap(zoom: number): L.Map {
    return {
        getZoom: () => zoom,
        flyTo: vi.fn()
    } as unknown as L.Map
}

afterEach(() => {
    cleanup()
    vi.mocked(fetchCafesNearBoulodrome).mockReset()
    window.localStorage.clear()
})

describe('useBoulodromeSelection', () => {
    it("ne charge aucun cafe tant qu'aucun boulodrome n'est selectionne", (): void => {
        const { result } = renderHook(() => useBoulodromeSelection(emptyFeatures))

        expect(result.current.selectedBoulodromeId).toBeNull()
        expect(result.current.nearbyCafes).toBeNull()
        expect(fetchCafesNearBoulodrome).not.toHaveBeenCalled()
    })

    it('selectionner un boulodrome charge ses cafes a proximite', async (): Promise<void> => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        const { result } = renderHook(() => useBoulodromeSelection(emptyFeatures))

        act(() => result.current.selectBoulodrome(ARSENAL))

        expect(result.current.selectedBoulodromeId).toBe('data-es:1')
        await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith('data-es:1'))
        await waitFor(() => expect(result.current.nearbyCafes).toEqual(emptyCafes))
    })

    it('un echec de chargement des cafes retombe sur null sans faire planter la selection', async (): Promise<void> => {
        vi.mocked(fetchCafesNearBoulodrome).mockRejectedValue(new Error('erreur reseau'))
        const { result } = renderHook(() => useBoulodromeSelection(emptyFeatures))

        act(() => result.current.selectBoulodrome(ARSENAL))

        await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalled())
        expect(result.current.selectedBoulodromeId).toBe('data-es:1')
        expect(result.current.nearbyCafes).toBeNull()
    })

    it('selectionner un boulodrome alimente l historique', (): void => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        const { result } = renderHook(() => useBoulodromeSelection(emptyFeatures))

        act(() => result.current.selectBoulodrome(ARSENAL))

        expect(result.current.history).toEqual([ARSENAL])
    })

    it('selectionner un boulodrome ouvre son marqueur et ferme le popup du precedent', (): void => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        const { result } = renderHook(() => useBoulodromeSelection(emptyFeatures))
        const arsenalMarker = fakeMarker()
        const vincennesMarker = fakeMarker()
        result.current.boulodromeMarkers.current.set('data-es:1', arsenalMarker)
        result.current.boulodromeMarkers.current.set('data-es:2', vincennesMarker)

        act(() => result.current.selectBoulodrome(ARSENAL))
        expect(arsenalMarker.openPopup).toHaveBeenCalledTimes(1)

        act(() => result.current.selectBoulodrome(VINCENNES))
        expect(arsenalMarker.closePopup).toHaveBeenCalledTimes(1)
        expect(vincennesMarker.openPopup).toHaveBeenCalledTimes(1)
    })

    it('selectionner un boulodrome recentre la carte (flyTo) sur ses coordonnees', (): void => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        const { result } = renderHook(() => useBoulodromeSelection(emptyFeatures))
        const map = fakeMap(12)
        result.current.mapRef.current = map

        act(() => result.current.selectBoulodrome(ARSENAL))

        expect(map.flyTo).toHaveBeenCalledTimes(1)
        const [latlng, zoom] = vi.mocked(map.flyTo).mock.calls[0]
        expect((latlng as L.LatLng).lat).toBeCloseTo(48.8494)
        expect((latlng as L.LatLng).lng).toBeCloseTo(2.3688)
        expect(zoom).toBe(16)
    })

    it('conserve le zoom courant du recentrage s il est deja >= 15', (): void => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        const { result } = renderHook(() => useBoulodromeSelection(emptyFeatures))
        result.current.mapRef.current = fakeMap(17)

        act(() => result.current.selectBoulodrome(ARSENAL))

        const [, zoom] = vi.mocked(result.current.mapRef.current.flyTo).mock.calls[0]
        expect(zoom).toBe(17)
    })

    it("deselectionner un id qui n'est plus le boulodrome selectionne n'ecrase pas la selection courante", (): void => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        const { result } = renderHook(() => useBoulodromeSelection(emptyFeatures))

        act(() => result.current.selectBoulodrome(ARSENAL))
        act(() => result.current.selectBoulodrome(VINCENNES))
        act(() => result.current.deselectBoulodrome('data-es:1'))

        expect(result.current.selectedBoulodromeId).toBe('data-es:2')
    })

    it('deselectionner le boulodrome selectionne vide la selection et les cafes a proximite', async (): Promise<void> => {
        vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes)
        const { result } = renderHook(() => useBoulodromeSelection(emptyFeatures))

        act(() => result.current.selectBoulodrome(ARSENAL))
        await waitFor(() => expect(result.current.nearbyCafes).toEqual(emptyCafes))

        act(() => result.current.deselectBoulodrome('data-es:1'))

        expect(result.current.selectedBoulodromeId).toBeNull()
        expect(result.current.nearbyCafes).toBeNull()
    })
})
