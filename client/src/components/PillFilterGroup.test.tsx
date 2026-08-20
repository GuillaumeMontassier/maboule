import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PillFilterGroup } from './PillFilterGroup'

afterEach(() => {
    cleanup()
})

describe('PillFilterGroup', () => {
    it('affiche le libellé de groupe comme un segment non interactif, absent des rôles bouton', () => {
        render(
            <PillFilterGroup
                groupLabel="Sol"
                options={['Sable', 'Terre battue']}
                selected={[]}
                onChange={vi.fn()}
            />
        )

        const label = screen.getByText('Sol')
        expect(label.tagName).toBe('SPAN')
        expect(screen.queryByRole('button', { name: 'Sol' })).toBeNull()
    })

    it("le segment libellé n'est pas dans l'ordre de tabulation", () => {
        render(
            <PillFilterGroup
                groupLabel="Sol"
                options={['Sable', 'Terre battue']}
                selected={[]}
                onChange={vi.fn()}
            />
        )

        const label = screen.getByText('Sol')
        expect(label.tabIndex).toBe(-1)
    })

    it('conserve la sélection multi-pilule indépendante par option (ticket 20)', () => {
        const onChange = vi.fn()
        render(
            <PillFilterGroup
                groupLabel="Sol"
                options={['Sable', 'Terre battue']}
                selected={['Sable']}
                onChange={onChange}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: 'Sol : Terre battue' }))

        expect(onChange).toHaveBeenCalledWith(['Sable', 'Terre battue'])
    })
})
