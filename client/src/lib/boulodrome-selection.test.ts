import { describe, expect, it } from 'vitest'
import { toBoulodromeHistoryEntry } from './boulodrome-selection'
import type { BoulodromesFeatureCollection } from '../api/boulodromes'

function featureAt(longitude: number, latitude: number): BoulodromesFeatureCollection['features'][number] {
    return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [longitude, latitude] },
        properties: {
            id: 'data-es:1',
            name: 'TERRAIN DE PETANQUE',
            street: '1 rue de Paris',
            postalCode: '75001',
            city: 'Paris',
            inseeCode: null,
            siteName: 'SQUARE DE TEST',
            equipmentType: null,
            groundType: null,
            freeAccess: null,
            source: 'data-es',
            lastSyncedAt: '2026-07-24T10:00:00.000Z'
        }
    }
}

describe('toBoulodromeHistoryEntry', () => {
    it('reprend id, name et siteName depuis les properties de la feature', (): void => {
        const entry = toBoulodromeHistoryEntry(featureAt(2.3522, 48.8566))

        expect(entry.id).toBe('data-es:1')
        expect(entry.name).toBe('TERRAIN DE PETANQUE')
        expect(entry.siteName).toBe('SQUARE DE TEST')
    })

    it('convertit les coordonnees GeoJSON [longitude, latitude] vers {latitude, longitude}', (): void => {
        const entry = toBoulodromeHistoryEntry(featureAt(2.3522, 48.8566))

        expect(entry.coordinates).toEqual({ latitude: 48.8566, longitude: 2.3522 })
    })
})
