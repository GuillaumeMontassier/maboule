import { Address, GeoCoordinates } from "./geo";

// Re-exportes pour compat : ces deux classes vivaient ici avant d'etre
// partagees avec le modele Cafe (cf. models/geo.ts).
export { Address, GeoCoordinates };

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
    // Nom du site abritant l'equipement (ex. "Jardin du port de l'Arsenal"),
    // distinct de `name` qui designe le terrain lui-meme (ex. "Grand terrain
    // de petanque") — les deux peuvent partager la meme valeur mais viennent
    // de deux enregistrements source differents.
    public siteName: string | null = null,
    // "Decouvert" / "Couvert" cote Data ES.
    public equipmentType: string | null = null,
    // Ex. "Stabilise/cendree", "Sable", "Beton"...
    public groundType: string | null = null,
    // "acces_libre" cote Data ES : accessible a tous en permanence (non
    // clos), sans reservation ni encadrement necessaire.
    public freeAccess: boolean | null = null,
  ) {}
}
