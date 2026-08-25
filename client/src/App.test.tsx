import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { fetchBoulodromes } from './api/boulodromes'
import type { BoulodromesFeatureCollection } from './api/boulodromes'

vi.mock('./api/boulodromes', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./api/boulodromes')>()),
    fetchBoulodromes: vi.fn()
}))

interface FeatureOverrides {
    id: string
    name: string
    street: string
    postalCode: string
    city: string
    siteName: string | null
    equipmentType: string
    groundType: string
    freeAccess: boolean
    coordinates: [number, number]
}

function featureWith(overrides: FeatureOverrides): BoulodromesFeatureCollection['features'][number] {
    return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: overrides.coordinates },
        properties: {
            id: overrides.id,
            name: overrides.name,
            street: overrides.street,
            postalCode: overrides.postalCode,
            city: overrides.city,
            inseeCode: null,
            siteName: overrides.siteName,
            equipmentType: overrides.equipmentType,
            groundType: overrides.groundType,
            freeAccess: overrides.freeAccess,
            source: 'data-es',
            lastSyncedAt: '2026-07-24T10:00:00.000Z'
        }
    }
}

const sableFeature = featureWith({
    id: 'data-es:1',
    name: 'TERRAIN DE PETANQUE',
    street: '1 rue de Paris',
    postalCode: '75001',
    city: 'Paris 1er Arrondissement',
    siteName: 'SQUARE DE TEST',
    equipmentType: 'Découvert',
    groundType: 'Sable',
    freeAccess: true,
    coordinates: [2.3522, 48.8566]
})

const stabiliseeFeature = featureWith({
    id: 'data-es:2',
    name: 'AUTRE TERRAIN',
    street: '2 rue de Paris',
    postalCode: '75002',
    city: 'Paris',
    siteName: null,
    equipmentType: 'Extérieur couvert',
    groundType: 'Stabilisé/cendrée',
    freeAccess: false,
    coordinates: [2.36, 48.86]
})

const sampleCollection: BoulodromesFeatureCollection = {
    type: 'FeatureCollection',
    features: [sableFeature, stabiliseeFeature]
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

    it('affiche la carte dès le montage, sans attendre la résolution du fetch (toujours montée, ticket 36)', () => {
        vi.mocked(fetchBoulodromes).mockReturnValue(new Promise(() => {}))

        const { container } = render(<App />)

        expect(container.querySelector('.leaflet-container')).toBeTruthy()
    })

    it(
        'garde le bouton dark mode et la carte montés pendant un changement de filtre (pas de remontage, ticket 36)',
        async () => {
            vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

            const { container } = render(<App />)
            await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(2))

            const toggleBefore = screen.getByRole('button', { name: 'Passer au thème sombre' })
            const mapBefore = container.querySelector('.leaflet-container')

            fireEvent.click(screen.getByRole('button', { name: 'Sol : Sable' }))

            expect(screen.getByRole('button', { name: 'Passer au thème sombre' })).toBe(toggleBefore)
            expect(container.querySelector('.leaflet-container')).toBe(mapBefore)
        }
    )

    it("affiche un message d'erreur si le chargement échoue", async () => {
        vi.mocked(fetchBoulodromes).mockRejectedValue(new Error('Erreur lors du chargement des boulodromes (500)'))

        render(<App />)

        expect(await screen.findByText(/erreur lors du chargement/i)).toBeTruthy()
    })

    it(
        'filtre les boulodromes affichés en mémoire quand la pilule « Sol : Sable » est activée, sans nouveau fetch',
        async () => {
            vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

            const { container } = render(<App />)
            await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(2))
            const fetchCallsBeforeFilter = vi.mocked(fetchBoulodromes).mock.calls.length

            const sablePill = screen.getByRole('button', { name: 'Sol : Sable' })
            fireEvent.click(sablePill)

            await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(1))
            expect(screen.getByRole('button', { name: /TERRAIN DE PETANQUE/ })).toBeTruthy()
            expect(screen.queryByRole('button', { name: /AUTRE TERRAIN/ })).toBeNull()
            // `aria-pressed` porte l'état actif/inactif de la pilule (ticket 20) -
            // c'est aussi ce qui pilote son style visuellement distinct.
            expect(sablePill.getAttribute('aria-pressed')).toBe('true')
            // Le filtre s'applique sur les données déjà chargées (ticket 36) : pas
            // de requête réseau supplémentaire déclenchée par ce clic.
            expect(vi.mocked(fetchBoulodromes).mock.calls.length).toBe(fetchCallsBeforeFilter)
        }
    )

    it('filtre les boulodromes affichés quand une pilule « équipement » est activée, sans nouveau fetch', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

        const { container } = render(<App />)
        await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(2))
        const fetchCallsBeforeFilter = vi.mocked(fetchBoulodromes).mock.calls.length

        fireEvent.click(screen.getByRole('button', { name: "Environnement : Découvert" }))

        await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(1))
        expect(screen.getByRole('button', { name: /TERRAIN DE PETANQUE/ })).toBeTruthy()
        expect(vi.mocked(fetchBoulodromes).mock.calls.length).toBe(fetchCallsBeforeFilter)
    })

    it("place le champ de recherche avant les filtres dans l'ordre du DOM (donc de tabulation)", async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

        const { container } = render(<App />)
        await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(2))

        const search = screen.getByLabelText('Rechercher un boulodrome')
        const firstFilterPill = screen.getByRole('button', { name: 'Sol : Stabilisé/cendrée' })

        // `compareDocumentPosition` : DOCUMENT_POSITION_FOLLOWING indique que
        // `firstFilterPill` vient après `search` dans le document - donc que
        // la recherche est bien avant les filtres, pas l'inverse (ticket 15).
        expect(search.compareDocumentPosition(firstFilterPill) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('filtre les boulodromes affichés quand le segment "Libre" est activé, sans nouveau fetch réseau', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

        const { container } = render(<App />)
        await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(2))
        const fetchCallsBeforeFilter = vi.mocked(fetchBoulodromes).mock.calls.length

        fireEvent.click(screen.getByRole('button', { name: 'Accès : Libre' }))

        await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(1))
        expect(screen.getByRole('button', { name: /TERRAIN DE PETANQUE/ })).toBeTruthy()
        expect(vi.mocked(fetchBoulodromes).mock.calls.length).toBe(fetchCallsBeforeFilter)
    })

    it('retire le filtre "Accès" en désactivant à nouveau le segment "Libre"', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

        const { container } = render(<App />)
        await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(2))

        const segment = screen.getByRole('button', { name: 'Accès : Libre' })
        fireEvent.click(segment)
        await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(1))

        fireEvent.click(segment)

        await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(2))
    })

    it('bascule vers "Restreint" quand le segment est activé alors que "Libre" était actif', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

        const { container } = render(<App />)
        await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(2))

        fireEvent.click(screen.getByRole('button', { name: 'Accès : Libre' }))
        await waitFor(() => expect(screen.getByRole('button', { name: /TERRAIN DE PETANQUE/ })).toBeTruthy())

        fireEvent.click(screen.getByRole('button', { name: 'Accès : Restreint' }))

        await waitFor(() => expect(screen.getByRole('button', { name: /AUTRE TERRAIN/ })).toBeTruthy())
        expect(screen.queryByRole('button', { name: /TERRAIN DE PETANQUE/ })).toBeNull()
    })

    it("n'affiche pas le bouton de réinitialisation des filtres quand aucun filtre n'est actif", async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

        render(<App />)
        await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledTimes(1))

        expect(screen.queryByRole('button', { name: 'Réinitialiser les filtres' })).toBeNull()
    })

    it("affiche le bouton de réinitialisation dès qu'un filtre devient actif", async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

        render(<App />)
        await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledTimes(1))

        fireEvent.click(screen.getByRole('button', { name: 'Sol : Sable' }))

        expect(await screen.findByRole('button', { name: 'Réinitialiser les filtres' })).toBeTruthy()
    })

    it('réinitialise les 3 groupes de filtres en un clic sur le bouton de réinitialisation', async () => {
        vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

        const { container } = render(<App />)
        await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(2))

        fireEvent.click(screen.getByRole('button', { name: 'Sol : Sable' }))
        fireEvent.click(screen.getByRole('button', { name: 'Accès : Libre' }))
        await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(1))

        fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }))

        await waitFor(() => expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(2))
        expect(screen.queryByRole('button', { name: 'Réinitialiser les filtres' })).toBeNull()
    })
})
