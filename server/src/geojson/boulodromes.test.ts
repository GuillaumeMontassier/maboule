import { describe, expect, it } from "vitest";
import type { BoulodromeRow } from "../db/boulodromesRepository";
import { toBoulodromeFeatureCollection } from "./boulodromes";

describe("toBoulodromeFeatureCollection", () => {
  it("convertit des lignes DB en FeatureCollection GeoJSON", () => {
    const rows: BoulodromeRow[] = [
      {
        id: "data-es:E002I751130012",
        name: "TERRAIN DE PETANQUE",
        street: "12 rue de Paris",
        postalCode: "75013",
        city: "Paris 13e Arrondissement",
        inseeCode: "75113",
        longitude: 2.368248,
        latitude: 48.820839,
        siteName: "SQUARE DE TEST",
        equipmentType: "Découvert",
        groundType: "Stabilisé/cendrée",
        freeAccess: true,
        source: "data-es",
        sourceId: "E002I751130012",
        lastSyncedAt: new Date("2026-07-24T10:00:00.000Z"),
      },
    ];

    const collection = toBoulodromeFeatureCollection(rows);

    expect(collection).toEqual({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          // [longitude, latitude], pas l'inverse.
          geometry: { type: "Point", coordinates: [2.368248, 48.820839] },
          properties: {
            id: "data-es:E002I751130012",
            name: "TERRAIN DE PETANQUE",
            street: "12 rue de Paris",
            postalCode: "75013",
            city: "Paris 13e Arrondissement",
            inseeCode: "75113",
            siteName: "SQUARE DE TEST",
            equipmentType: "Découvert",
            groundType: "Stabilisé/cendrée",
            freeAccess: true,
            source: "data-es",
            lastSyncedAt: "2026-07-24T10:00:00.000Z",
          },
        },
      ],
    });
  });

  it("retourne une FeatureCollection vide pour un tableau vide", () => {
    expect(toBoulodromeFeatureCollection([])).toEqual({
      type: "FeatureCollection",
      features: [],
    });
  });
});
