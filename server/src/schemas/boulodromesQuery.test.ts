import { describe, expect, it } from "vitest";
import { boulodromesQuerySchema } from "./boulodromesQuery";

function parse(query: Record<string, unknown>) {
  return boulodromesQuerySchema.safeParse(query);
}

describe("boulodromesQuerySchema - q", () => {
  it("trim la valeur et l'expose telle quelle", () => {
    const result = parse({ q: "  arsenal  " });
    expect(result.success && result.data.q).toBe("arsenal");
  });

  it("traite une valeur absente ou vide comme aucun filtre", () => {
    expect(parse({}).success && parse({}).data?.q).toBeUndefined();
    const result = parse({ q: "   " });
    expect(result.success && result.data.q).toBeUndefined();
  });

  it("rejette une valeur répétée (tableau) comme invalide", () => {
    const result = parse({ q: ["arsenal", "vincennes"] });
    expect(result.success).toBe(false);
  });
});

describe("boulodromesQuerySchema - groundType / equipmentType", () => {
  it("découpe une liste séparée par des virgules", () => {
    const result = parse({ groundType: "Sable,Stabilisé/cendrée" });
    expect(result.success && result.data.groundType).toEqual(["Sable", "Stabilisé/cendrée"]);
  });

  it("accepte la répétition du paramètre", () => {
    const result = parse({ equipmentType: ["Découvert", "Extérieur couvert"] });
    expect(result.success && result.data.equipmentType).toEqual(["Découvert", "Extérieur couvert"]);
  });

  it("traite une liste vide (que des virgules/espaces) comme aucun filtre", () => {
    const result = parse({ groundType: " , , " });
    expect(result.success && result.data.groundType).toBeUndefined();
  });
});

describe("boulodromesQuerySchema - freeAccess", () => {
  it('accepte "true" et "false"', () => {
    expect(parse({ freeAccess: "true" }).success && parse({ freeAccess: "true" }).data?.freeAccess).toBe(
      true,
    );
    expect(
      parse({ freeAccess: "false" }).success && parse({ freeAccess: "false" }).data?.freeAccess,
    ).toBe(false);
  });

  it("est absent quand non fourni", () => {
    const result = parse({});
    expect(result.success && result.data.freeAccess).toBeUndefined();
  });

  it("rejette toute valeur autre que true/false", () => {
    expect(parse({ freeAccess: "yes" }).success).toBe(false);
    expect(parse({ freeAccess: "" }).success).toBe(false);
    expect(parse({ freeAccess: ["true", "false"] }).success).toBe(false);
  });
});

describe("boulodromesQuerySchema - bbox", () => {
  it("parse un rectangle valide west,south,east,north", () => {
    const result = parse({ bbox: "2.2,48.8,2.5,48.9" });
    expect(result.success && result.data.bbox).toEqual({
      west: 2.2,
      south: 48.8,
      east: 2.5,
      north: 48.9,
    });
  });

  it("est absent quand non fourni", () => {
    const result = parse({});
    expect(result.success && result.data.bbox).toBeUndefined();
  });

  it("rejette un nombre de valeurs incorrect", () => {
    expect(parse({ bbox: "2.2,48.8,2.5" }).success).toBe(false);
  });

  it("rejette une valeur non numérique", () => {
    expect(parse({ bbox: "2.2,not-a-number,2.5,48.9" }).success).toBe(false);
  });

  it("rejette un rectangle dégénéré (west >= east ou south >= north)", () => {
    expect(parse({ bbox: "2.5,48.8,2.2,48.9" }).success).toBe(false);
    expect(parse({ bbox: "2.2,48.9,2.5,48.8" }).success).toBe(false);
  });
});
