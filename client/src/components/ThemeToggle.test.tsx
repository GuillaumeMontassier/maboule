import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ThemeToggle } from './ThemeToggle'

afterEach(() => {
    cleanup()
    document.documentElement.classList.remove('dark')
    window.localStorage.clear()
})

beforeEach(() => {
    window.localStorage.clear()
})

describe('ThemeToggle', () => {
    it("affiche l'icône lucide Moon (pas l'emoji 🌙) en thème clair", () => {
        render(<ThemeToggle />)

        const button = screen.getByRole('button', { name: 'Passer au thème sombre' })
        expect(button.querySelector('svg.lucide-moon')).toBeTruthy()
        expect(button.textContent).not.toContain('🌙')
    })

    it("bascule vers l'icône lucide Sun (pas l'emoji ☀️) après activation", () => {
        render(<ThemeToggle />)

        const button = screen.getByRole('button', { name: 'Passer au thème sombre' })
        fireEvent.click(button)

        expect(screen.getByRole('button', { name: 'Passer au thème clair' })).toBeTruthy()
        expect(button.querySelector('svg.lucide-sun')).toBeTruthy()
        expect(button.textContent).not.toContain('☀️')
    })

    it('conserve aria-label et title inchangés (changement purement visuel, ticket 19)', () => {
        render(<ThemeToggle />)

        const button = screen.getByRole('button', { name: 'Passer au thème sombre' })
        expect(button.getAttribute('title')).toBe('Thème sombre')

        fireEvent.click(button)

        expect(button.getAttribute('aria-label')).toBe('Passer au thème clair')
        expect(button.getAttribute('title')).toBe('Thème clair')
    })
})
