import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function readStoredTheme(): Theme | null {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        return raw === 'light' || raw === 'dark' ? raw : null
    } catch {
        // localStorage indisponible (navigation privee, quota) : pas de choix
        // memorise, on se rabat sur la preference systeme.
        return null
    }
}

function prefersDarkScheme(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getInitialTheme(): Theme {
    return readStoredTheme() ?? (prefersDarkScheme() ? 'dark' : 'light')
}

function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    // Suit la bascule manuelle plutot que de laisser `color-scheme: light dark`
    // (pose dans `index.css`) retomber sur la preference systeme - sans ca, les
    // controles natifs (champs de recherche, scrollbars) resteraient stylees
    // selon l'OS meme apres un choix explicite contraire dans l'app.
    document.documentElement.style.colorScheme = theme
}

// Bascule le theme clair/sombre de l'application - pose/retire la classe
// `.dark` sur `<html>`, dont depend le variant Tailwind `dark:` (cf.
// `@custom-variant dark` dans `index.css`). En l'absence de choix memorise,
// suit `prefers-color-scheme` du systeme (cf. spec phase 6, ticket 10) : la
// valeur initiale n'est donc PAS persistee au montage, seul un choix
// explicite (bascule) l'est - sinon la preference systeme se figerait des la
// premiere visite et cesserait d'etre suivie pour un utilisateur qui n'a
// jamais touche le bouton.
export function useTheme() {
    const [theme, setTheme] = useState<Theme>(getInitialTheme)

    useEffect(() => {
        applyTheme(theme)
    }, [theme])

    const toggleTheme = useCallback(() => {
        setTheme((current) => {
            const next: Theme = current === 'dark' ? 'light' : 'dark'
            try {
                window.localStorage.setItem(STORAGE_KEY, next)
            } catch {
                // Best-effort : la persistance echoue silencieusement (quota,
                // navigation privee), le theme reste applique pour la session.
            }
            return next
        })
    }, [])

    return { theme, toggleTheme }
}
