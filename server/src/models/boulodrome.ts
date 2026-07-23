export class GeoCoordinates {
  constructor(
    public latitude: number,
    public longitude: number,
  ) {}
}

export class Address {
  constructor(
    public street: string,
    public postalCode: string,
    public city: string,
    public inseeCode?: string,
  ) {}
}

export type BoulodromeSource = "opendata-paris" | "data-es" | "manual";

export class Boulodrome {
  constructor(
    public id: string,
    public name: string,
    public address: Address,
    public coordinates: GeoCoordinates,
    public source: BoulodromeSource,
    public sourceId: string,
    public lastSyncedAt: Date,
  ) {}
}
