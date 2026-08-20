import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AccessFilter } from './AccessFilter'

afterEach((): void => {
    cleanup()
})

describe('AccessFilter', () => {
    it('active le segment "Libre" et transmet `true` au parent quand aucun filtre n\'est actif', (): void => {
        const onChange = vi.fn()
        render(<AccessFilter value={undefined} onChange={onChange} />)

        fireEvent.click(screen.getByRole('button', { name: 'Accès : Libre' }))

        expect(onChange).toHaveBeenCalledWith(true)
    })

    it('active le segment "Restreint" et transmet `false` au parent quand aucun filtre n\'est actif', (): void => {
        const onChange = vi.fn()
        render(<AccessFilter value={undefined} onChange={onChange} />)

        fireEvent.click(screen.getByRole('button', { name: 'Accès : Restreint' }))

        expect(onChange).toHaveBeenCalledWith(false)
    })

    it('ne marque jamais "Restreint" comme actif quand "Libre" est le filtre courant', (): void => {
        render(<AccessFilter value={true} onChange={vi.fn()} />)

        expect(screen.getByRole('button', { name: 'Accès : Libre' }).getAttribute('aria-pressed')).toBe('true')
        expect(screen.getByRole('button', { name: 'Accès : Restreint' }).getAttribute('aria-pressed')).toBe('false')
    })

    it('cliquer sur "Restreint" pendant que "Libre" est actif bascule le filtre sur `false`, jamais les deux à la fois', (): void => {
        const onChange = vi.fn()
        render(<AccessFilter value={true} onChange={onChange} />)

        fireEvent.click(screen.getByRole('button', { name: 'Accès : Restreint' }))

        expect(onChange).toHaveBeenCalledWith(false)
        expect(onChange).not.toHaveBeenCalledWith(true)
    })

    it('recliquer sur le segment actif "Libre" retire le filtre (retour à `undefined`)', (): void => {
        const onChange = vi.fn()
        render(<AccessFilter value={true} onChange={onChange} />)

        fireEvent.click(screen.getByRole('button', { name: 'Accès : Libre' }))

        expect(onChange).toHaveBeenCalledWith(undefined)
    })

    it('recliquer sur le segment actif "Restreint" retire le filtre (retour à `undefined`)', (): void => {
        const onChange = vi.fn()
        render(<AccessFilter value={false} onChange={onChange} />)

        fireEvent.click(screen.getByRole('button', { name: 'Accès : Restreint' }))

        expect(onChange).toHaveBeenCalledWith(undefined)
    })
})
