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
