import { describe, expect, it } from "vitest";
import { toCafe } from "./osmCafes";

describe("toCafe", () => {
  it("mappe un noeud OSM avec adresse complète vers un Cafe", () => {
    const node = {
      type: "node" as const,
      id: 247455918,
      lat: 48.8616428,
      lon: 2.3359304,
      tags: {
        amenity: "cafe",
        name: "Le Café Marly",
        "addr:housenumber": "93",
        "addr:street": "Rue de Rivoli",
        "addr:postcode": "75001",
        "addr:city": "Paris",
      },
    };

    const cafe = toCafe(node);

    expect(cafe.id).toBe("osm:node/247455918");
    expect(cafe.name).toBe("Le Café Marly");
    expect(cafe.amenityType).toBe("cafe");
    expect(cafe.source).toBe("osm");
    expect(cafe.sourceId).toBe("247455918");
    // lat/lon en entree -> latitude/longitude en sortie, sans inversion.
    expect(cafe.coordinates).toEqual({ latitude: 48.8616428, longitude: 2.3359304 });
    expect(cafe.address).toEqual({
      street: "93 Rue de Rivoli",
      postalCode: "75001",
      city: "Paris",
    });
  });

  it("retourne une adresse à null quand les tags addr:* sont absents", () => {
    const node = {
      type: "node" as const,
      id: 247439149,
      lat: 48.8687856,
      lon: 2.3275106,
      tags: { amenity: "bar", name: "Bar Hemingway" },
    };

    expect(toCafe(node).address).toBeNull();
  });

  it("retourne une adresse à null quand un des tags addr:* clés est manquant", () => {
    const node = {
      type: "node" as const,
      id: 1,
      lat: 48.85,
      lon: 2.35,
      tags: {
        amenity: "pub",
        name: "Pub sans code postal",
        "addr:street": "Rue de Rivoli",
        "addr:city": "Paris",
      },
    };

    expect(toCafe(node).address).toBeNull();
  });

  it("compose le numéro et la rue quand addr:housenumber est présent", () => {
    const node = {
      type: "node" as const,
      id: 2,
      lat: 48.85,
      lon: 2.35,
      tags: {
        amenity: "cafe",
        name: "Sans numéro",
        "addr:street": "Rue de Rivoli",
        "addr:postcode": "75001",
        "addr:city": "Paris",
      },
    };

    expect(toCafe(node).address?.street).toBe("Rue de Rivoli");
  });
});
