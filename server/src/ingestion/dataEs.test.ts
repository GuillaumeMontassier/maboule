import { describe, expect, it } from "vitest";
import { toBoulodrome } from "./dataEs";
import type { DataEsEquipementRecord, DataEsInstallationRecord } from "./dataEs";

describe("toBoulodrome", () => {
  it("mappe un couple équipement/installation vers un Boulodrome", () => {
    const equipement: DataEsEquipementRecord = {
      numero: "E002I751130012",
      nom: "TERRAIN DE PETANQUE",
      type: "Terrain de petanque",
      famille: "Boulodrome",
      installation_numero: "I751130012",
      nature: "Découvert",
      aire_nature_sol: "Stabilisé/cendrée",
      coordonnees: { lon: 2.368248, lat: 48.820839 },
    };
    const installation: DataEsInstallationRecord = {
      numero: "I751130012",
      nom: "SQUARE DE TEST",
      adresse: "12 rue de Paris",
      cp: "75013",
      commune: "Paris 13e Arrondissement",
      insee: "75113",
      // Volontairement different de equipement.coordonnees : un site peut
      // porter plusieurs terrains, la position doit venir de l'equipement.
      coordonnees: { lon: 2.4, lat: 48.9 },
    };

    const boulodrome = toBoulodrome(equipement, installation);

    expect(boulodrome.id).toBe("data-es:E002I751130012");
    expect(boulodrome.name).toBe("TERRAIN DE PETANQUE");
    expect(boulodrome.source).toBe("data-es");
    expect(boulodrome.sourceId).toBe("E002I751130012");
    expect(boulodrome.address).toEqual({
      street: "12 rue de Paris",
      postalCode: "75013",
      city: "Paris 13e Arrondissement",
      inseeCode: "75113",
    });
    // coordonnees.lon/lat en entree -> longitude/latitude en sortie,
    // sans inversion (piege frequent avec les API geo qui donnent (lon, lat)).
    expect(boulodrome.coordinates).toEqual({
      latitude: 48.820839,
      longitude: 2.368248,
    });
    expect(boulodrome.siteName).toBe("SQUARE DE TEST");
    expect(boulodrome.equipmentType).toBe("Découvert");
    expect(boulodrome.groundType).toBe("Stabilisé/cendrée");
  });
});
