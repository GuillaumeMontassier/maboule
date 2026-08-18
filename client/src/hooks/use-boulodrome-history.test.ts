import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useBoulodromeHistory } from './use-boulodrome-history'

const STORAGE_KEY = 'boulodrome-search-history'

afterEach(() => {
    cleanup()
    window.localStorage.clear()
})

describe('useBoulodromeHistory', () => {
    it("commence vide en l'absence d'historique en localStorage", () => {
        const { result } = renderHook(() => useBoulodromeHistory())

        expect(result.current.history).toEqual([])
    })

    it('ajoute une entree en tete de liste', () => {
        const { result } = renderHook(() => useBoulodromeHistory())

        act(() => result.current.addToHistory({ id: 'data-es:1', name: 'ARSENAL', siteName: null }))

        expect(result.current.history).toEqual([{ id: 'data-es:1', name: 'ARSENAL', siteName: null }])
    })

    it('conserve siteName sur une entree qui en a un', () => {
        const { result } = renderHook(() => useBoulodromeHistory())

        act(() => result.current.addToHistory({ id: 'data-es:1', name: 'TERRAIN 1', siteName: 'SQUARE DE TEST' }))

        expect(result.current.history).toEqual([{ id: 'data-es:1', name: 'TERRAIN 1', siteName: 'SQUARE DE TEST' }])
    })

    it('deduplique : reselectionner une entree deja presente la remonte en tete sans la dupliquer', () => {
        const { result } = renderHook(() => useBoulodromeHistory())

        act(() => result.current.addToHistory({ id: 'data-es:1', name: 'ARSENAL', siteName: null }))
        act(() => result.current.addToHistory({ id: 'data-es:2', name: 'VINCENNES', siteName: null }))
        act(() => result.current.addToHistory({ id: 'data-es:1', name: 'ARSENAL', siteName: null }))

        expect(result.current.history).toEqual([
            { id: 'data-es:1', name: 'ARSENAL', siteName: null },
            { id: 'data-es:2', name: 'VINCENNES', siteName: null }
        ])
    })

    it("limite l'historique a 5 entrees, les plus anciennes sont retirees en premier", () => {
        const { result } = renderHook(() => useBoulodromeHistory())

        for (let index = 1; index <= 6; index += 1) {
            act(() => result.current.addToHistory({ id: `data-es:${index}`, name: `TERRAIN ${index}`, siteName: null }))
        }

        expect(result.current.history).toHaveLength(5)
        expect(result.current.history[0]).toEqual({ id: 'data-es:6', name: 'TERRAIN 6', siteName: null })
        expect(result.current.history.map((entry) => entry.id)).not.toContain('data-es:1')
    })

    it("persiste l'historique en localStorage entre deux montages (rechargement de page)", () => {
        const { result, unmount } = renderHook(() => useBoulodromeHistory())
        act(() => result.current.addToHistory({ id: 'data-es:1', name: 'ARSENAL', siteName: null }))
        unmount()

        const { result: resultAfterReload } = renderHook(() => useBoulodromeHistory())

        expect(resultAfterReload.current.history).toEqual([{ id: 'data-es:1', name: 'ARSENAL', siteName: null }])
    })

    it('ignore un contenu localStorage corrompu plutot que de planter', () => {
        window.localStorage.setItem(STORAGE_KEY, '{ not valid json')

        const { result } = renderHook(() => useBoulodromeHistory())

        expect(result.current.history).toEqual([])
    })

    it("retire une entree de l'historique par id, sans toucher aux autres", () => {
        const { result } = renderHook(() => useBoulodromeHistory())

        act(() => result.current.addToHistory({ id: 'data-es:1', name: 'ARSENAL', siteName: null }))
        act(() => result.current.addToHistory({ id: 'data-es:2', name: 'VINCENNES', siteName: null }))
        act(() => result.current.removeFromHistory('data-es:1'))

        expect(result.current.history).toEqual([{ id: 'data-es:2', name: 'VINCENNES', siteName: null }])
    })

    it("persiste la suppression en localStorage (l'entree retiree ne revient pas apres rechargement)", () => {
        const { result, unmount } = renderHook(() => useBoulodromeHistory())

        act(() => result.current.addToHistory({ id: 'data-es:1', name: 'ARSENAL', siteName: null }))
        act(() => result.current.addToHistory({ id: 'data-es:2', name: 'VINCENNES', siteName: null }))
        act(() => result.current.removeFromHistory('data-es:1'))
        unmount()

        const { result: resultAfterReload } = renderHook(() => useBoulodromeHistory())

        expect(resultAfterReload.current.history).toEqual([{ id: 'data-es:2', name: 'VINCENNES', siteName: null }])
    })

    it('normalise (limite a 5, deduplique) un contenu localStorage deja hors invariants a la lecture', () => {
        // Contenu qu'on ne peut pas garantir avoir ete ecrit par cette version de
        // l'app (edition manuelle, version differente avec un autre plafond) :
        // au-dela de 5 entrees et avec un id duplique.
        const entries = Array.from({ length: 6 }, (_, index) => ({
            id: `data-es:${index + 1}`,
            name: `TERRAIN ${index + 1}`,
            siteName: null
        }))
        entries.push({ id: 'data-es:1', name: 'TERRAIN 1 (doublon)', siteName: null })
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

    it("traite comme siteName: null une entree stockee avant l'introduction de ce champ (ticket 23)", () => {
        // Contenu ecrit par une version anterieure de l'app, sans `siteName` du
        // tout (et non `siteName: null` explicite) : doit rester lisible plutot
        // que d'etre rejete par la validation a la lecture.
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 'data-es:1', name: 'ARSENAL' }]))

        const { result } = renderHook(() => useBoulodromeHistory())

        expect(result.current.history).toEqual([{ id: 'data-es:1', name: 'ARSENAL', siteName: null }])
    })
})
