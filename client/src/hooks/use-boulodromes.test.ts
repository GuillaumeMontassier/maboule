import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { useBoulodromes, type BoulodromesPillFilters } from './use-boulodromes'
import { fetchBoulodromes } from '../api/boulodromes'
import type { Bbox, BoulodromesFeatureCollection } from '../api/boulodromes'

vi.mock('../api/boulodromes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../api/boulodromes')>()),
    fetchBoulodromes: vi.fn()
}))

const PARIS_BBOX: Bbox = { west: 2.2, south: 48.8, east: 2.5, north: 48.9 }
const OTHER_BBOX: Bbox = { west: 2.6, south: 48.7, east: 2.9, north: 48.75 }

const NO_FILTERS: BoulodromesPillFilters = { groundTypes: [], equipmentTypes: [], freeAccess: undefined }

interface BoulodromePropertyOverrides {
    groundType?: string | null
    equipmentType?: string | null
    freeAccess?: boolean | null
}

function featureWith(
    id: string,
    overrides: BoulodromePropertyOverrides = {}
): BoulodromesFeatureCollection['features'][number] {
    return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [2.35, 48.85] },
        properties: {
            id,
            name: 'TERRAIN DE PETANQUE',
            street: '1 rue de Paris',
            postalCode: '75001',
            city: 'Paris',
            inseeCode: null,
            siteName: null,
            equipmentType: overrides.equipmentType ?? null,
            groundType: overrides.groundType ?? null,
            freeAccess: overrides.freeAccess ?? null,
            source: 'data-es',
            lastSyncedAt: '2026-07-24T10:00:00.000Z'
        }
    }
}

function collectionOf(...features: BoulodromesFeatureCollection['features']): BoulodromesFeatureCollection {
    return { type: 'FeatureCollection', features }
}

afterEach((): void => {
    cleanup()
    vi.mocked(fetchBoulodromes).mockReset()
})

describe('useBoulodromes', () => {
    it("n'effectue aucun fetch tant qu'aucun bbox n'a ete signale", (): void => {
        renderHook(() => useBoulodromes(NO_FILTERS))

        expect(fetchBoulodromes).not.toHaveBeenCalled()
    })

    it(
        'fetch avec le bbox uniquement (pas les filtres de pilule) des que setBbox est appele',
        async (): Promise<void> => {
            vi.mocked(fetchBoulodromes).mockResolvedValue(collectionOf(featureWith('data-es:1')))
            const filters: BoulodromesPillFilters = { groundTypes: ['Sable'], equipmentTypes: [], freeAccess: true }
            const { result } = renderHook(() => useBoulodromes(filters))

            act(() => result.current.setBbox(PARIS_BBOX))

            await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledExactlyOnceWith({ bbox: PARIS_BBOX }))
        }
    )

    it('marque isFetching pendant la requete puis le repasse a false a la resolution', async (): Promise<void> => {
        let resolveFetch!: (data: BoulodromesFeatureCollection) => void
        vi.mocked(fetchBoulodromes).mockReturnValue(new Promise((resolve) => (resolveFetch = resolve)))
        const { result } = renderHook(() => useBoulodromes(NO_FILTERS))

        act(() => result.current.setBbox(PARIS_BBOX))
        expect(result.current.isFetching).toBe(true)

        await act(async () => resolveFetch(collectionOf(featureWith('data-es:1'))))

        expect(result.current.isFetching).toBe(false)
    })

    it(
        'ne redeclenche pas de fetch quand le meme bbox est signale de nouveau (bbox inchange)',
        async (): Promise<void> => {
            vi.mocked(fetchBoulodromes).mockResolvedValue(collectionOf(featureWith('data-es:1')))
            const { result } = renderHook(() => useBoulodromes(NO_FILTERS))

            act(() => result.current.setBbox(PARIS_BBOX))
            await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledTimes(1))

            act(() => result.current.setBbox({ ...PARIS_BBOX }))

            expect(fetchBoulodromes).toHaveBeenCalledTimes(1)
        }
    )

    it('refetch quand le bbox change reellement', async (): Promise<void> => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(collectionOf(featureWith('data-es:1')))
        const { result } = renderHook(() => useBoulodromes(NO_FILTERS))

        act(() => result.current.setBbox(PARIS_BBOX))
        await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledTimes(1))

        act(() => result.current.setBbox(OTHER_BBOX))

        await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledTimes(2))
        expect(fetchBoulodromes).toHaveBeenLastCalledWith({ bbox: OTHER_BBOX })
    })

    it(
        'ne change pas de fetch quand seuls les filtres de pilule changent (appliques en memoire, pas au reseau)',
        async (): Promise<void> => {
            vi.mocked(fetchBoulodromes).mockResolvedValue(collectionOf(featureWith('data-es:1')))
            const { result, rerender } = renderHook(({ filters }) => useBoulodromes(filters), {
                initialProps: { filters: NO_FILTERS }
            })

            act(() => result.current.setBbox(PARIS_BBOX))
            await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledTimes(1))

            rerender({ filters: { groundTypes: ['Sable'], equipmentTypes: [], freeAccess: undefined } })

            expect(fetchBoulodromes).toHaveBeenCalledTimes(1)
        }
    )

    it(
        'garde les donnees deja chargees affichees pendant un nouveau fetch (pas de vidage immediat)',
        async (): Promise<void> => {
            vi.mocked(fetchBoulodromes).mockResolvedValueOnce(collectionOf(featureWith('data-es:1')))
            const { result } = renderHook(() => useBoulodromes(NO_FILTERS))

            act(() => result.current.setBbox(PARIS_BBOX))
            await waitFor(() => expect(result.current.features.features).toHaveLength(1))

            let resolveSecondFetch!: (data: BoulodromesFeatureCollection) => void
            vi.mocked(fetchBoulodromes).mockReturnValueOnce(new Promise((resolve) => (resolveSecondFetch = resolve)))
            act(() => result.current.setBbox(OTHER_BBOX))

            expect(result.current.isFetching).toBe(true)
            expect(result.current.features.features).toHaveLength(1)

            await act(async () => resolveSecondFetch(collectionOf(featureWith('data-es:2'), featureWith('data-es:3'))))

            expect(result.current.features.features).toHaveLength(2)
        }
    )

    it(
        'filtre par nature du sol (groundType) sur les donnees deja chargees, sans nouveau fetch',
        async (): Promise<void> => {
            vi.mocked(fetchBoulodromes).mockResolvedValue(
                collectionOf(
                    featureWith('data-es:1', { groundType: 'Sable' }),
                    featureWith('data-es:2', { groundType: 'Stabilisé/cendrée' })
                )
            )
            const filters: BoulodromesPillFilters = {
                groundTypes: ['Sable'],
                equipmentTypes: [],
                freeAccess: undefined
            }
            const { result } = renderHook(() => useBoulodromes(filters))

            act(() => result.current.setBbox(PARIS_BBOX))

            await waitFor(() => expect(result.current.features.features).toHaveLength(1))
            expect(result.current.features.features[0].properties.id).toBe('data-es:1')
        }
    )

    it("filtre par type d'equipement (equipmentType) sur les donnees deja chargees", async (): Promise<void> => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(
            collectionOf(
                featureWith('data-es:1', { equipmentType: 'Découvert' }),
                featureWith('data-es:2', { equipmentType: 'Extérieur couvert' })
            )
        )
        const filters: BoulodromesPillFilters = {
            groundTypes: [],
            equipmentTypes: ['Découvert'],
            freeAccess: undefined
        }
        const { result } = renderHook(() => useBoulodromes(filters))

        act(() => result.current.setBbox(PARIS_BBOX))

        await waitFor(() => expect(result.current.features.features).toHaveLength(1))
        expect(result.current.features.features[0].properties.id).toBe('data-es:1')
    })

    it('filtre par acces libre/payant (freeAccess) sur les donnees deja chargees', async (): Promise<void> => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(
            collectionOf(
                featureWith('data-es:1', { freeAccess: true }),
                featureWith('data-es:2', { freeAccess: false })
            )
        )
        const filters: BoulodromesPillFilters = { groundTypes: [], equipmentTypes: [], freeAccess: true }
        const { result } = renderHook(() => useBoulodromes(filters))

        act(() => result.current.setBbox(PARIS_BBOX))

        await waitFor(() => expect(result.current.features.features).toHaveLength(1))
        expect(result.current.features.features[0].properties.id).toBe('data-es:1')
    })

    it('combine plusieurs filtres actifs (ET logique, pas OU)', async (): Promise<void> => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(
            collectionOf(
                featureWith('data-es:1', { groundType: 'Sable', freeAccess: true }),
                featureWith('data-es:2', { groundType: 'Sable', freeAccess: false }),
                featureWith('data-es:3', { groundType: 'Stabilisé/cendrée', freeAccess: true })
            )
        )
        const filters: BoulodromesPillFilters = { groundTypes: ['Sable'], equipmentTypes: [], freeAccess: true }
        const { result } = renderHook(() => useBoulodromes(filters))

        act(() => result.current.setBbox(PARIS_BBOX))

        await waitFor(() => expect(result.current.features.features).toHaveLength(1))
        expect(result.current.features.features[0].properties.id).toBe('data-es:1')
    })

    it('expose un message d’erreur quand le fetch echoue', async (): Promise<void> => {
        vi.mocked(fetchBoulodromes).mockRejectedValue(new Error('Erreur lors du chargement des boulodromes (500)'))
        const { result } = renderHook(() => useBoulodromes(NO_FILTERS))

        act(() => result.current.setBbox(PARIS_BBOX))

        await waitFor(() => expect(result.current.error).toBe('Erreur lors du chargement des boulodromes (500)'))
        expect(result.current.isFetching).toBe(false)
    })
})
