import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { describeBoulodromesState, useBoulodromes, type BoulodromesPillFilters } from './use-boulodromes'
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

    it("commence en 'initial-loading' avant tout appel a setBbox", (): void => {
        const { result } = renderHook(() => useBoulodromes(NO_FILTERS))

        expect(result.current.state).toEqual({ status: 'initial-loading' })
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

    it(
        'reste en initial-loading pendant le tout premier fetch puis passe a ready a la resolution',
        async (): Promise<void> => {
            let resolveFetch!: (data: BoulodromesFeatureCollection) => void
            vi.mocked(fetchBoulodromes).mockReturnValue(new Promise((resolve) => (resolveFetch = resolve)))
            const { result } = renderHook(() => useBoulodromes(NO_FILTERS))

            act(() => result.current.setBbox(PARIS_BBOX))
            // `state` vaut deja 'initial-loading' avant meme `setBbox` (valeur par
            // defaut) - verifier aussi que le fetch a bien demarre confirme que cet
            // etat est le resultat de l'effet declenche par `setBbox`, pas juste la
            // valeur initiale inchangee.
            expect(fetchBoulodromes).toHaveBeenCalledExactlyOnceWith({ bbox: PARIS_BBOX })
            expect(result.current.state).toEqual({ status: 'initial-loading' })

            await act(async () => resolveFetch(collectionOf(featureWith('data-es:1'))))

            expect(result.current.state).toEqual({ status: 'ready', isRefetching: false, refetchError: null })
        }
    )

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
        'garde les donnees deja chargees affichees pendant un rechargement (pas de vidage immediat)',
        async (): Promise<void> => {
            vi.mocked(fetchBoulodromes).mockResolvedValueOnce(collectionOf(featureWith('data-es:1')))
            const { result } = renderHook(() => useBoulodromes(NO_FILTERS))

            act(() => result.current.setBbox(PARIS_BBOX))
            await waitFor(() => expect(result.current.features.features).toHaveLength(1))

            let resolveSecondFetch!: (data: BoulodromesFeatureCollection) => void
            vi.mocked(fetchBoulodromes).mockReturnValueOnce(new Promise((resolve) => (resolveSecondFetch = resolve)))
            act(() => result.current.setBbox(OTHER_BBOX))

            // Rechargement en arriere-plan (un premier succes existe deja) : le
            // statut reste 'ready' avec isRefetching a true, contrairement au tout
            // premier chargement qui repasserait en 'initial-loading' (ticket 37) -
            // c'est cette distinction qui permet a l'UI de rester silencieuse ici.
            expect(result.current.state).toEqual({ status: 'ready', isRefetching: true, refetchError: null })
            expect(result.current.features.features).toHaveLength(1)

            await act(async () => resolveSecondFetch(collectionOf(featureWith('data-es:2'), featureWith('data-es:3'))))

            expect(result.current.state).toEqual({ status: 'ready', isRefetching: false, refetchError: null })
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

    describe('premier chargement en echec (ticket 37)', () => {
        it("passe en 'initial-error' quand le tout premier fetch echoue", async (): Promise<void> => {
            vi.mocked(fetchBoulodromes).mockRejectedValue(new Error('Erreur lors du chargement des boulodromes (500)'))
            const { result } = renderHook(() => useBoulodromes(NO_FILTERS))

            act(() => result.current.setBbox(PARIS_BBOX))

            await waitFor(() =>
                expect(result.current.state).toEqual({
                    status: 'initial-error',
                    message: 'Erreur lors du chargement des boulodromes (500)'
                })
            )
        })

        it(
            "un nouveau bbox apres un echec initial repasse en 'initial-loading', pas en rechargement silencieux",
            async (): Promise<void> => {
                // Aucun succes n'a encore jamais eu lieu : ce nouveau fetch doit rester
                // traite comme un premier chargement (bloquant), pas comme un
                // rechargement en arriere-plan silencieux - il n'y a toujours aucune
                // donnee a montrer en attendant.
                vi.mocked(fetchBoulodromes).mockRejectedValueOnce(new Error('boom'))
                const { result } = renderHook(() => useBoulodromes(NO_FILTERS))

                act(() => result.current.setBbox(PARIS_BBOX))
                await waitFor(() => expect(result.current.state.status).toBe('initial-error'))

                let resolveRetry!: (data: BoulodromesFeatureCollection) => void
                vi.mocked(fetchBoulodromes).mockReturnValueOnce(new Promise((resolve) => (resolveRetry = resolve)))
                act(() => result.current.setBbox(OTHER_BBOX))

                expect(result.current.state).toEqual({ status: 'initial-loading' })

                await act(async () => resolveRetry(collectionOf(featureWith('data-es:1'))))
                expect(result.current.state).toEqual({ status: 'ready', isRefetching: false, refetchError: null })
            }
        )
    })

    describe('rechargement en arriere-plan en echec (ticket 37)', () => {
        it(
            'un rechargement en echec apres un premier succes reste ready avec un refetchError, sans vider les donnees',
            async (): Promise<void> => {
                vi.mocked(fetchBoulodromes).mockResolvedValueOnce(collectionOf(featureWith('data-es:1')))
                const { result } = renderHook(() => useBoulodromes(NO_FILTERS))

                act(() => result.current.setBbox(PARIS_BBOX))
                await waitFor(() => expect(result.current.state.status).toBe('ready'))

                vi.mocked(fetchBoulodromes).mockRejectedValueOnce(new Error('Erreur reseau'))
                act(() => result.current.setBbox(OTHER_BBOX))

                await waitFor(() =>
                    expect(result.current.state).toEqual({
                        status: 'ready',
                        isRefetching: false,
                        refetchError: 'Erreur reseau'
                    })
                )
                // Les donnees du dernier bbox reussi restent affichees.
                expect(result.current.features.features).toHaveLength(1)
            }
        )

        it('le refetchError est efface des que le rechargement suivant reussit', async (): Promise<void> => {
            vi.mocked(fetchBoulodromes).mockResolvedValueOnce(collectionOf(featureWith('data-es:1')))
            const { result } = renderHook(() => useBoulodromes(NO_FILTERS))
            act(() => result.current.setBbox(PARIS_BBOX))
            await waitFor(() => expect(result.current.state.status).toBe('ready'))

            vi.mocked(fetchBoulodromes).mockRejectedValueOnce(new Error('Erreur reseau'))
            act(() => result.current.setBbox(OTHER_BBOX))
            await waitFor(() => expect(result.current.state).toMatchObject({ refetchError: 'Erreur reseau' }))

            vi.mocked(fetchBoulodromes).mockResolvedValueOnce(collectionOf(featureWith('data-es:2')))
            act(() => result.current.setBbox(PARIS_BBOX))

            await waitFor(() =>
                expect(result.current.state).toEqual({ status: 'ready', isRefetching: false, refetchError: null })
            )
        })

        it(
            'le refetchError reste affiche pendant que le rechargement suivant est en vol (efface seulement au succes)',
            async (): Promise<void> => {
                vi.mocked(fetchBoulodromes).mockResolvedValueOnce(collectionOf(featureWith('data-es:1')))
                const { result } = renderHook(() => useBoulodromes(NO_FILTERS))
                act(() => result.current.setBbox(PARIS_BBOX))
                await waitFor(() => expect(result.current.state.status).toBe('ready'))

                vi.mocked(fetchBoulodromes).mockRejectedValueOnce(new Error('Erreur reseau'))
                act(() => result.current.setBbox(OTHER_BBOX))
                await waitFor(() => expect(result.current.state).toMatchObject({ refetchError: 'Erreur reseau' }))

                let resolveRetry!: (data: BoulodromesFeatureCollection) => void
                vi.mocked(fetchBoulodromes).mockReturnValueOnce(new Promise((resolve) => (resolveRetry = resolve)))
                act(() => result.current.setBbox(PARIS_BBOX))

                expect(result.current.state).toEqual({
                    status: 'ready',
                    isRefetching: true,
                    refetchError: 'Erreur reseau'
                })

                await act(async () => resolveRetry(collectionOf(featureWith('data-es:2'))))
                expect(result.current.state).toEqual({ status: 'ready', isRefetching: false, refetchError: null })
            }
        )
    })
})

describe('describeBoulodromesState', () => {
    it("affiche le texte de chargement, sans style d'erreur, pour 'initial-loading'", (): void => {
        expect(describeBoulodromesState({ status: 'initial-loading' })).toEqual({
            message: 'Chargement des boulodromes…',
            isError: false
        })
    })

    it("affiche le message d'erreur avec le style d'erreur pour 'initial-error'", (): void => {
        expect(describeBoulodromesState({ status: 'initial-error', message: 'Erreur reseau' })).toEqual({
            message: 'Erreur reseau',
            isError: true
        })
    })

    it("n'affiche rien pour 'ready' sans refetchError (rechargement reussi ou silencieux)", (): void => {
        expect(describeBoulodromesState({ status: 'ready', isRefetching: false, refetchError: null })).toEqual({
            message: null,
            isError: false
        })
        expect(describeBoulodromesState({ status: 'ready', isRefetching: true, refetchError: null })).toEqual({
            message: null,
            isError: false
        })
    })

    it("affiche le refetchError en erreur pour 'ready', que le rechargement suivant soit en vol ou non", (): void => {
        expect(
            describeBoulodromesState({ status: 'ready', isRefetching: false, refetchError: 'Erreur reseau' })
        ).toEqual({
            message: 'Erreur reseau',
            isError: true
        })
        expect(
            describeBoulodromesState({ status: 'ready', isRefetching: true, refetchError: 'Erreur reseau' })
        ).toEqual({
            message: 'Erreur reseau',
            isError: true
        })
    })

    it("un message d'erreur vide reste affiche (isError: true), pas confondu avec 'rien a montrer'", (): void => {
        // Cas limite : un `Error('')` (message vide) doit toujours declencher le
        // style d'erreur - `message` vide n'est pas confondu avec `message: null`
        // ("rien a afficher"), contrairement a une verification de verite
        // (`if (message)`) qui masquerait silencieusement ce cas.
        expect(describeBoulodromesState({ status: 'initial-error', message: '' })).toEqual({
            message: '',
            isError: true
        })
    })
})
