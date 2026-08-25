import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useBoulodromeHistory } from './use-boulodrome-history'

const STORAGE_KEY = 'boulodrome-search-history'

const ARSENAL_COORDINATES = { latitude: 48.8494, longitude: 2.3688 }
const VINCENNES_COORDINATES = { latitude: 48.8286, longitude: 2.4372 }

afterEach(() => {
    cleanup()
    window.localStorage.clear()
})

describe('useBoulodromeHistory', () => {
    it("commence vide en l'absence d'historique en localStorage", (): void => {
        const { result } = renderHook(() => useBoulodromeHistory())

        expect(result.current.history).toEqual([])
    })

    it('ajoute une entree en tete de liste', (): void => {
        const { result } = renderHook(() => useBoulodromeHistory())

        act(() =>
            result.current.addToHistory({
                id: 'data-es:1',
                name: 'ARSENAL',
                siteName: null,
                coordinates: ARSENAL_COORDINATES
            })
        )

        expect(result.current.history).toEqual([
            { id: 'data-es:1', name: 'ARSENAL', siteName: null, coordinates: ARSENAL_COORDINATES }
        ])
    })

    it('conserve siteName sur une entree qui en a un', (): void => {
        const { result } = renderHook(() => useBoulodromeHistory())

        act(() =>
            result.current.addToHistory({
                id: 'data-es:1',
                name: 'TERRAIN 1',
                siteName: 'SQUARE DE TEST',
                coordinates: ARSENAL_COORDINATES
            })
        )

        expect(result.current.history).toEqual([
            { id: 'data-es:1', name: 'TERRAIN 1', siteName: 'SQUARE DE TEST', coordinates: ARSENAL_COORDINATES }
        ])
    })

    it('conserve les coordonnees de chaque entree', (): void => {
        const { result } = renderHook(() => useBoulodromeHistory())

        act(() =>
            result.current.addToHistory({
                id: 'data-es:1',
                name: 'ARSENAL',
                siteName: null,
                coordinates: ARSENAL_COORDINATES
            })
        )

        expect(result.current.history[0].coordinates).toEqual(ARSENAL_COORDINATES)
    })

    it('deduplique : reselectionner une entree deja presente la remonte en tete sans la dupliquer', (): void => {
        const { result } = renderHook(() => useBoulodromeHistory())

        act(() =>
            result.current.addToHistory({
                id: 'data-es:1',
                name: 'ARSENAL',
                siteName: null,
                coordinates: ARSENAL_COORDINATES
            })
        )
        act(() =>
            result.current.addToHistory({
                id: 'data-es:2',
                name: 'VINCENNES',
                siteName: null,
                coordinates: VINCENNES_COORDINATES
            })
        )
        act(() =>
            result.current.addToHistory({
                id: 'data-es:1',
                name: 'ARSENAL',
                siteName: null,
                coordinates: ARSENAL_COORDINATES
            })
        )

        expect(result.current.history).toEqual([
            { id: 'data-es:1', name: 'ARSENAL', siteName: null, coordinates: ARSENAL_COORDINATES },
            { id: 'data-es:2', name: 'VINCENNES', siteName: null, coordinates: VINCENNES_COORDINATES }
        ])
    })

    it("limite l'historique a 5 entrees, les plus anciennes sont retirees en premier", (): void => {
        const { result } = renderHook(() => useBoulodromeHistory())

        for (let index = 1; index <= 6; index += 1) {
            act(() =>
                result.current.addToHistory({
                    id: `data-es:${index}`,
                    name: `TERRAIN ${index}`,
                    siteName: null,
                    coordinates: ARSENAL_COORDINATES
                })
            )
        }

        expect(result.current.history).toHaveLength(5)
        expect(result.current.history[0]).toEqual({
            id: 'data-es:6',
            name: 'TERRAIN 6',
            siteName: null,
            coordinates: ARSENAL_COORDINATES
        })
        expect(result.current.history.map((entry) => entry.id)).not.toContain('data-es:1')
    })

    it("persiste l'historique en localStorage entre deux montages (rechargement de page)", (): void => {
        const { result, unmount } = renderHook(() => useBoulodromeHistory())
        act(() =>
            result.current.addToHistory({
                id: 'data-es:1',
                name: 'ARSENAL',
                siteName: null,
                coordinates: ARSENAL_COORDINATES
            })
        )
        unmount()

        const { result: resultAfterReload } = renderHook(() => useBoulodromeHistory())

        expect(resultAfterReload.current.history).toEqual([
            { id: 'data-es:1', name: 'ARSENAL', siteName: null, coordinates: ARSENAL_COORDINATES }
        ])
    })

    it('ignore un contenu localStorage corrompu plutot que de planter', (): void => {
        window.localStorage.setItem(STORAGE_KEY, '{ not valid json')

        const { result } = renderHook(() => useBoulodromeHistory())

        expect(result.current.history).toEqual([])
    })

    it("retire une entree de l'historique par id, sans toucher aux autres", (): void => {
        const { result } = renderHook(() => useBoulodromeHistory())

        act(() =>
            result.current.addToHistory({
                id: 'data-es:1',
                name: 'ARSENAL',
                siteName: null,
                coordinates: ARSENAL_COORDINATES
            })
        )
        act(() =>
            result.current.addToHistory({
                id: 'data-es:2',
                name: 'VINCENNES',
                siteName: null,
                coordinates: VINCENNES_COORDINATES
            })
        )
        act(() => result.current.removeFromHistory('data-es:1'))

        expect(result.current.history).toEqual([
            { id: 'data-es:2', name: 'VINCENNES', siteName: null, coordinates: VINCENNES_COORDINATES }
        ])
    })

    it("persiste la suppression en localStorage (l'entree retiree ne revient pas apres rechargement)", (): void => {
        const { result, unmount } = renderHook(() => useBoulodromeHistory())

        act(() =>
            result.current.addToHistory({
                id: 'data-es:1',
                name: 'ARSENAL',
                siteName: null,
                coordinates: ARSENAL_COORDINATES
            })
        )
        act(() =>
            result.current.addToHistory({
                id: 'data-es:2',
                name: 'VINCENNES',
                siteName: null,
                coordinates: VINCENNES_COORDINATES
            })
        )
        act(() => result.current.removeFromHistory('data-es:1'))
        unmount()

        const { result: resultAfterReload } = renderHook(() => useBoulodromeHistory())

        expect(resultAfterReload.current.history).toEqual([
            { id: 'data-es:2', name: 'VINCENNES', siteName: null, coordinates: VINCENNES_COORDINATES }
        ])
    })

    it('normalise (limite a 5, deduplique) un contenu localStorage deja hors invariants a la lecture', (): void => {
        // Contenu qu'on ne peut pas garantir avoir ete ecrit par cette version de
        // l'app (edition manuelle, version differente avec un autre plafond) :
        // au-dela de 5 entrees et avec un id duplique.
        const entries = Array.from({ length: 6 }, (_, index) => ({
            id: `data-es:${index + 1}`,
            name: `TERRAIN ${index + 1}`,
            siteName: null,
            coordinates: ARSENAL_COORDINATES
        }))
        entries.push({ id: 'data-es:1', name: 'TERRAIN 1 (doublon)', siteName: null, coordinates: ARSENAL_COORDINATES })
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))

        const { result } = renderHook(() => useBoulodromeHistory())

        expect(result.current.history).toHaveLength(5)
        expect(result.current.history.map((entry) => entry.id)).toEqual([
            'data-es:1',
            'data-es:2',
            'data-es:3',
            'data-es:4',
            'data-es:5'
        ])
    })

    it("traite comme siteName: null une entree stockee avant l'introduction de ce champ (ticket 23)", (): void => {
        // Contenu ecrit par une version anterieure de l'app, sans `siteName` du
        // tout (et non `siteName: null` explicite) : doit rester lisible plutot
        // que d'etre rejete par la validation a la lecture. `coordinates` est en
        // revanche present (introduit apres siteName mais avant ce contenu),
        // pour isoler la migration testee ici de celle du ticket 36 ci-dessous.
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify([{ id: 'data-es:1', name: 'ARSENAL', coordinates: ARSENAL_COORDINATES }])
        )

        const { result } = renderHook(() => useBoulodromeHistory())

        expect(result.current.history).toEqual([
            { id: 'data-es:1', name: 'ARSENAL', siteName: null, coordinates: ARSENAL_COORDINATES }
        ])
    })

    it(
        "ecarte une entree stockee avant l'introduction de coordinates plutot que de la migrer (ticket 36)",
        (): void => {
            // Contenu ecrit par une version anterieure de l'app, avant l'ajout de
            // `coordinates` (necessaire au `flyTo` d'un boulodrome hors du viewport
            // actuel) : contrairement a `siteName`, il n'y a pas de valeur par
            // defaut sensee a lui substituer - l'entree est ecartee.
            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify([
                    { id: 'data-es:1', name: 'ARSENAL', siteName: null },
                    { id: 'data-es:2', name: 'VINCENNES', siteName: null, coordinates: VINCENNES_COORDINATES }
                ])
            )

            const { result } = renderHook(() => useBoulodromeHistory())

            expect(result.current.history).toEqual([
                { id: 'data-es:2', name: 'VINCENNES', siteName: null, coordinates: VINCENNES_COORDINATES }
            ])
        }
    )
})
