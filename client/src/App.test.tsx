import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { fetchBoulodromes } from './api/boulodromes'
import type { BoulodromesFeatureCollection } from './api/boulodromes'

vi.mock('./api/boulodromes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./api/boulodromes')>()),
    fetchBoulodromes: vi.fn()
}))

const sampleCollection: BoulodromesFeatureCollection = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
            properties: {
                id: 'data-es:1',
                name: 'TERRAIN DE PETANQUE',
                street: '1 rue de Paris',
                postalCode: '75001',
                city: 'Paris 1er Arrondissement',
                inseeCode: '75101',
                siteName: 'SQUARE DE TEST',
                equipmentType: 'Découvert',
                groundType: 'Stabilisé/cendrée',
                freeAccess: true,
                source: 'data-es',
                lastSyncedAt: '2026-07-24T10:00:00.000Z'
            }
        }
    ]
}

afterEach(() => {
    cleanup()
    vi.mocked(fetchBoulodromes).mockReset()
})

describe('App', () => {
    it('affiche un message de chargement le temps de récupérer les données', () => {
        vi.mocked(fetchBoulodromes).mockReturnValue(new Promise(() => {}))

        render(<App />)

        expect(screen.getByText(/chargement/i)).toBeTruthy()
    })

    it('affiche le bouton de bascule dark mode dès le chargement initial (indépendant des boulodromes)', () => {
        vi.mocked(fetchBoulodromes).mockReturnValue(new Promise(() => {}))

        render(<App />)

        expect(screen.getByRole('button', { name: 'Passer au thème sombre' })).toBeTruthy()
    })

    it('garde le même bouton de bascule dark mode monté pendant un rechargement déclenché par un filtre (pas de démontage/remontage)', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

        render(<App />)
        await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledTimes(1))

        const toggleBefore = screen.getByRole('button', { name: 'Passer au thème sombre' })

        fireEvent.click(screen.getByRole('button', { name: 'Nature du sol : Sable' }))

        await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledTimes(2))
        const toggleAfter = screen.getByRole('button', { name: 'Passer au thème sombre' })

        expect(toggleAfter).toBe(toggleBefore)
    })

    it('affiche la carte une fois les boulodromes chargés', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

        const { container } = render(<App />)

        await waitFor(() => {
            expect(container.querySelector('.leaflet-container')).toBeTruthy()
        })
    })

    it("affiche un message d'erreur si le chargement échoue", async () => {
        vi.mocked(fetchBoulodromes).mockRejectedValue(new Error('Erreur lors du chargement des boulodromes (500)'))

        render(<App />)

        expect(await screen.findByText(/erreur lors du chargement/i)).toBeTruthy()
    })

    it('recharge les boulodromes avec le filtre sélectionné quand une pilule "nature du sol" est activée', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

        render(<App />)
        await waitFor(() =>
            expect(fetchBoulodromes).toHaveBeenCalledWith({
                groundTypes: [],
                equipmentTypes: [],
                freeAccess: undefined
            })
        )

        const sablePill = screen.getByRole('button', { name: 'Nature du sol : Sable' })
        fireEvent.click(sablePill)

        await waitFor(() =>
            expect(fetchBoulodromes).toHaveBeenCalledWith({
                groundTypes: ['Sable'],
                equipmentTypes: [],
                freeAccess: undefined
            })
        )
        // `aria-pressed` porte l'état actif/inactif de la pilule (ticket 20) -
        // c'est aussi ce qui pilote son style visuellement distinct.
        expect(sablePill.getAttribute('aria-pressed')).toBe('true')
    })

    it('recharge les boulodromes avec le filtre sélectionné quand une pilule "type d\'équipement" est activée', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

        render(<App />)
        await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledTimes(1))

        fireEvent.click(screen.getByRole('button', { name: "Type d'équipement : Découvert" }))

        await waitFor(() =>
            expect(fetchBoulodromes).toHaveBeenCalledWith({
                groundTypes: [],
                equipmentTypes: ['Découvert'],
                freeAccess: undefined
            })
        )
    })

    it("place le champ de recherche avant les filtres dans l'ordre du DOM (donc de tabulation)", async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

        const { container } = render(<App />)
        await waitFor(() => expect(container.querySelector('.leaflet-container')).toBeTruthy())

        const search = screen.getByLabelText('Rechercher un boulodrome')
        const firstFilterPill = screen.getByRole('button', { name: 'Nature du sol : Stabilisé/cendrée' })

        // `compareDocumentPosition` : DOCUMENT_POSITION_FOLLOWING indique que
        // `firstFilterPill` vient après `search` dans le document - donc que
        // la recherche est bien avant les filtres, pas l'inverse (ticket 15).
        expect(search.compareDocumentPosition(firstFilterPill) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('recharge les boulodromes avec le filtre appliqué quand la pilule "Accès libre" est activée', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

        render(<App />)
        await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledTimes(1))

        fireEvent.click(screen.getByRole('button', { name: 'Accès libre' }))

        await waitFor(() =>
            expect(fetchBoulodromes).toHaveBeenCalledWith({
                groundTypes: [],
                equipmentTypes: [],
                freeAccess: true
            })
        )
    })

    it('retire le filtre "Accès libre" en désactivant à nouveau la pilule', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

        render(<App />)
        await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledTimes(1))

        const pill = screen.getByRole('button', { name: 'Accès libre' })
        fireEvent.click(pill)
        await waitFor(() =>
            expect(fetchBoulodromes).toHaveBeenCalledWith({
                groundTypes: [],
                equipmentTypes: [],
                freeAccess: true
            })
        )

        fireEvent.click(pill)

        await waitFor(() =>
            expect(fetchBoulodromes).toHaveBeenCalledWith({
                groundTypes: [],
                equipmentTypes: [],
                freeAccess: undefined
            })
        )
    })
})
