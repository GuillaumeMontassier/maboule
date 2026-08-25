import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AccessFilter } from './AccessFilter'

afterEach(() => {
    cleanup()
})

describe('AccessFilter', () => {
    it('active "Libre" et jamais "Restreint" simultanément au clic sur "Libre"', (): void => {
        const onChange = vi.fn()
        render(<AccessFilter value={undefined} onChange={onChange} />)

        fireEvent.click(screen.getByRole('button', { name: 'Accès : Libre' }))

        expect(onChange).toHaveBeenCalledWith(true)
    })

    it('active "Restreint" et jamais "Libre" simultanément au clic sur "Restreint"', (): void => {
        const onChange = vi.fn()
        render(<AccessFilter value={undefined} onChange={onChange} />)

        fireEvent.click(screen.getByRole('button', { name: 'Accès : Restreint' }))

        expect(onChange).toHaveBeenCalledWith(false)
    })

    it('reflète la sélection exclusive dans aria-pressed quand "Libre" est actif', (): void => {
        render(<AccessFilter value={true} onChange={vi.fn()} />)

        expect(screen.getByRole('button', { name: 'Accès : Libre' }).getAttribute('aria-pressed')).toBe('true')
        expect(screen.getByRole('button', { name: 'Accès : Restreint' }).getAttribute('aria-pressed')).toBe('false')
    })

    it('reflète la sélection exclusive dans aria-pressed quand "Restreint" est actif', (): void => {
        render(<AccessFilter value={false} onChange={vi.fn()} />)

        expect(screen.getByRole('button', { name: 'Accès : Libre' }).getAttribute('aria-pressed')).toBe('false')
        expect(screen.getByRole('button', { name: 'Accès : Restreint' }).getAttribute('aria-pressed')).toBe('true')
    })

    it('reclique sur le segment actif "Libre" pour revenir à "pas de filtre"', (): void => {
        const onChange = vi.fn()
        render(<AccessFilter value={true} onChange={onChange} />)

        fireEvent.click(screen.getByRole('button', { name: 'Accès : Libre' }))

        expect(onChange).toHaveBeenCalledWith(undefined)
    })

    it('reclique sur le segment actif "Restreint" pour revenir à "pas de filtre"', (): void => {
        const onChange = vi.fn()
        render(<AccessFilter value={false} onChange={onChange} />)

        fireEvent.click(screen.getByRole('button', { name: 'Accès : Restreint' }))

        expect(onChange).toHaveBeenCalledWith(undefined)
    })
})
