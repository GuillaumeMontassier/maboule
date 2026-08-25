import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchBoulodromes } from './boulodromes'

const sampleCollection = {
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
                source: 'data-es',
                lastSyncedAt: '2026-07-24T10:00:00.000Z'
            }
        }
    ]
} as const

describe('fetchBoulodromes', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("retourne le JSON de la réponse quand l'appel réussit", async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(sampleCollection)
            })
        )

        const result = await fetchBoulodromes()

        expect(result).toEqual(sampleCollection)
    })

    it("lève une erreur quand la réponse n'est pas ok", async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

        await expect(fetchBoulodromes()).rejects.toThrow('500')
    })

    it("n'ajoute pas de paramètre quand aucun filtre n'est fourni", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(sampleCollection)
        })
        vi.stubGlobal('fetch', fetchMock)

        await fetchBoulodromes()

        expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/boulodromes')
    })

    it('ajoute un paramètre groundType par valeur sélectionnée', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(sampleCollection)
        })
        vi.stubGlobal('fetch', fetchMock)

        await fetchBoulodromes({ groundTypes: ['Sable', 'Stabilisé/cendrée'] })

        const calledUrl = fetchMock.mock.calls[0][0] as string
        const params = new URL(calledUrl).searchParams
        expect(params.getAll('groundType')).toEqual(['Sable', 'Stabilisé/cendrée'])
    })

    it('ajoute un paramètre equipmentType par valeur sélectionnée', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(sampleCollection)
        })
        vi.stubGlobal('fetch', fetchMock)

        await fetchBoulodromes({ equipmentTypes: ['Découvert'] })

        const calledUrl = fetchMock.mock.calls[0][0] as string
        const params = new URL(calledUrl).searchParams
        expect(params.getAll('equipmentType')).toEqual(['Découvert'])
    })

    it('ajoute le paramètre freeAccess quand il est défini', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(sampleCollection)
        })
        vi.stubGlobal('fetch', fetchMock)

        await fetchBoulodromes({ freeAccess: true })

        const calledUrl = fetchMock.mock.calls[0][0] as string
        const params = new URL(calledUrl).searchParams
        expect(params.get('freeAccess')).toBe('true')
    })

    it("n'ajoute pas le paramètre freeAccess quand il est absent", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(sampleCollection)
        })
        vi.stubGlobal('fetch', fetchMock)

        await fetchBoulodromes({})

        expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/boulodromes')
    })

    it('ajoute le paramètre bbox au format west,south,east,north quand il est fourni', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(sampleCollection)
        })
        vi.stubGlobal('fetch', fetchMock)

        await fetchBoulodromes({ bbox: { west: 2.2, south: 48.8, east: 2.5, north: 48.9 } })

        const calledUrl = fetchMock.mock.calls[0][0] as string
        const params = new URL(calledUrl).searchParams
        expect(params.get('bbox')).toBe('2.2,48.8,2.5,48.9')
    })

    it("n'ajoute pas le paramètre bbox quand il est absent", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(sampleCollection)
        })
        vi.stubGlobal('fetch', fetchMock)

        await fetchBoulodromes({})

        expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/boulodromes')
    })
})
