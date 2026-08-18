import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/use-theme'

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Passer au thème clair' : 'Passer au thème sombre'}
            title={isDark ? 'Thème clair' : 'Thème sombre'}
            // 96px : place ce bouton au-dessus des controles de zoom (bas-droite,
            // ticket 07) sans les chevaucher. Marge genereuse plutot qu'un calcul
            // au pixel pres sur la hauteur du controle Leaflet, qui varie selon le
            // support tactile detecte par Leaflet (~52px en souris, ~64px en
            // tactile) - verifie en navigateur (Playwright, mode tactile,
            // l'hypothese la plus large) : aucun chevauchement avec le controle de
            // zoom. Meme marge laterale de 12px que les autres panneaux flottants.
            className="fixed right-3 bottom-24 z-[1000] flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    )
}
