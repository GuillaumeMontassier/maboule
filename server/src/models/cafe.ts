import { Address, GeoCoordinates } from './geo'

export type CafeAmenityType = 'cafe' | 'bar' | 'pub'
export type CafeSource = 'osm' | 'manual'

export class Cafe {
    constructor(
        public id: string,
        public name: string,
        // "cafe" | "bar" | "pub" - cote OSM, le tag `amenity`.
        public amenityType: CafeAmenityType,
        public coordinates: GeoCoordinates,
        public source: CafeSource,
        public sourceId: string,
        public lastSyncedAt: Date,
        // Les tags `addr:*` ne sont pas systematiquement renseignes dans OSM -
        // null plutot que des champs individuellement optionnels : soit
        // l'adresse est connue en entier, soit elle est absente.
        public address: Address | null = null
    ) {}
}
