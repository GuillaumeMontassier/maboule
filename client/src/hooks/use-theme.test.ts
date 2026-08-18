import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useTheme } from './use-theme'

const STORAGE_KEY = 'theme'

function mockPrefersColorScheme(matches: boolean) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: (query: string) => ({
            matches,
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {}
        })
    })
}

afterEach(() => {
    cleanup()
    window.localStorage.clear()
    document.documentElement.classList.remove('dark')
})

describe('useTheme', () => {
    it("suit la preference systeme (sombre) en l'absence de choix memorise", () => {
        mockPrefersColorScheme(true)

        const { result } = renderHook(() => useTheme())

        expect(result.current.theme).toBe('dark')
    })

    it("suit la preference systeme (claire) en l'absence de choix memorise", () => {
        mockPrefersColorScheme(false)

        const { result } = renderHook(() => useTheme())

        expect(result.current.theme).toBe('light')
    })

    it('bascule le theme et pose/retire la classe .dark sur <html>', () => {
        mockPrefersColorScheme(false)
        const { result } = renderHook(() => useTheme())

        act(() => result.current.toggleTheme())
        expect(result.current.theme).toBe('dark')
        expect(document.documentElement.classList.contains('dark')).toBe(true)

        act(() => result.current.toggleTheme())
        expect(result.current.theme).toBe('light')
        expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it("ne persiste pas la valeur initiale deduite de la preference systeme tant qu'aucun choix explicite n'a ete fait", () => {
        // Sinon la preference systeme se figerait des le premier chargement :
        // un changement ulterieur de `prefers-color-scheme` (ex. mode nuit
        // programme par l'OS) cesserait d'etre suivi pour un utilisateur qui n'a
        // jamais touche le bouton de bascule.
        mockPrefersColorScheme(true)

        renderHook(() => useTheme())

        expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('persiste le choix en localStorage entre deux montages (rechargement de page)', () => {
        mockPrefersColorScheme(false)
        const { result, unmount } = renderHook(() => useTheme())
        act(() => result.current.toggleTheme())
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe('dark')
        unmount()

        // Preference systeme inchangee (claire) mais un choix explicite est
        // memorise : il doit primer sur `prefers-color-scheme` au remontage.
        const { result: resultAfterReload } = renderHook(() => useTheme())

        expect(resultAfterReload.current.theme).toBe('dark')
    })
})
