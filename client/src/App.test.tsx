import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { fetchBoulodromes } from './api/boulodromes'
import type { BoulodromesFeatureCollection } from './api/boulodromes'

vi.mock('./api/boulodromes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api/boulodromes')>()),
  fetchBoulodromes: vi.fn(),
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
        lastSyncedAt: '2026-07-24T10:00:00.000Z',
      },
    },
  ],
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

  it("garde le même bouton de bascule dark mode monté pendant un rechargement déclenché par un filtre (pas de démontage/remontage)", async () => {
    vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

    render(<App />)
    await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledTimes(1))

    const toggleBefore = screen.getByRole('button', { name: 'Passer au thème sombre' })

    fireEvent.click(screen.getByLabelText('Sable'))

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

  it('recharge les boulodromes avec le filtre sélectionné quand une case "nature du sol" est cochée', async () => {
    vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

    render(<App />)
    await waitFor(() =>
      expect(fetchBoulodromes).toHaveBeenCalledWith({
        groundTypes: [],
        equipmentTypes: [],
        freeAccess: undefined,
      }),
    )

    fireEvent.click(screen.getByLabelText('Sable'))

    await waitFor(() =>
      expect(fetchBoulodromes).toHaveBeenCalledWith({
        groundTypes: ['Sable'],
        equipmentTypes: [],
        freeAccess: undefined,
      }),
    )
  })

  it('recharge les boulodromes avec le filtre sélectionné quand une case "type d\'équipement" est cochée', async () => {
    vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

    render(<App />)
    await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByLabelText('Découvert'))

    await waitFor(() =>
      expect(fetchBoulodromes).toHaveBeenCalledWith({
        groundTypes: [],
        equipmentTypes: ['Découvert'],
        freeAccess: undefined,
      }),
    )
  })

  it('recharge les boulodromes avec le filtre sélectionné dans le sélecteur "Accès"', async () => {
    vi.mocked(fetchBoulodromes).mockResolvedValue(sampleCollection)

    render(<App />)
    await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledTimes(1))

    fireEvent.change(screen.getByLabelText('Accès'), { target: { value: 'true' } })

    await waitFor(() =>
      expect(fetchBoulodromes).toHaveBeenCalledWith({
        groundTypes: [],
        equipmentTypes: [],
        freeAccess: true,
      }),
    )
  })
})
