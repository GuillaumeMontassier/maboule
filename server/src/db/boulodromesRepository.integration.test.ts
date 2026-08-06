import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { Address, Boulodrome, GeoCoordinates } from "../models/boulodrome";
import { findAllBoulodromes, upsertBoulodromes } from "./boulodromesRepository";
import { db } from "./client";
import { boulodromes } from "./schema";

// Ces tests tapent le vrai Postgres/PostGIS local (docker compose up -d) :
// separes de `npm run test` dans `npm run test:integration`, pour que les
// tests unitaires purs restent rapides et n'exigent pas Docker.
const TEST_ID = "test:integration-boulodrome";

function buildTestBoulodrome(
  overrides: Partial<{
    id: string;
    sourceId: string;
    name: string;
    street: string;
    city: string;
    latitude: number;
    longitude: number;
    siteName: string | null;
    equipmentType: string | null;
    groundType: string | null;
    freeAccess: boolean | null;
  }> = {},
): Boulodrome {
  return new Boulodrome(
    overrides.id ?? TEST_ID,
    overrides.name ?? "Boulodrome de test",
    new Address(
      overrides.street ?? "1 rue du Test",
      "75001",
      overrides.city ?? "Paris 1er Arrondissement",
      "75101",
    ),
    new GeoCoordinates(overrides.latitude ?? 48.8566, overrides.longitude ?? 2.3522),
    "manual",
    overrides.sourceId ?? "integration-test",
    new Date("2026-07-24T10:00:00.000Z"),
    overrides.siteName ?? "Square de test",
    overrides.equipmentType ?? "Découvert",
    overrides.groundType ?? "Stabilisé/cendrée",
    overrides.freeAccess ?? true,
  );
}

afterEach(async () => {
  await db.delete(boulodromes).where(eq(boulodromes.id, TEST_ID));
});

describe("boulodromesRepository (integration)", () => {
  it("insère puis relit un boulodrome avec les coordonnées exactes (round-trip PostGIS)", async () => {
    await upsertBoulodromes(db, [buildTestBoulodrome()]);

    const rows = await findAllBoulodromes(db);
    const row = rows.find((r) => r.id === TEST_ID);

    expect(row).toBeDefined();
    expect(row?.name).toBe("Boulodrome de test");
    // ST_X/ST_Y sur une colonne geography : on verifie qu'on retombe bien
    // sur les valeurs d'origine (a la precision flottante pres).
    expect(row?.longitude).toBeCloseTo(2.3522, 6);
    expect(row?.latitude).toBeCloseTo(48.8566, 6);
    expect(row?.siteName).toBe("Square de test");
    expect(row?.equipmentType).toBe("Découvert");
    expect(row?.groundType).toBe("Stabilisé/cendrée");
    expect(row?.freeAccess).toBe(true);
  });

  it("met à jour la ligne existante plutôt que d'en créer une nouvelle (upsert)", async () => {
    await upsertBoulodromes(db, [buildTestBoulodrome({ name: "Premier nom" })]);
    await upsertBoulodromes(db, [buildTestBoulodrome({ name: "Nom mis à jour" })]);

    const rows = await findAllBoulodromes(db);
    const matching = rows.filter((r) => r.id === TEST_ID);

    expect(matching).toHaveLength(1);
    expect(matching[0].name).toBe("Nom mis à jour");
  });
});

describe("findAllBoulodromes (recherche)", () => {
  const ARSENAL_ID = "test:search-arsenal";
  const VINCENNES_ID = "test:search-vincennes";

  afterEach(async () => {
    await db.delete(boulodromes).where(eq(boulodromes.id, ARSENAL_ID));
    await db.delete(boulodromes).where(eq(boulodromes.id, VINCENNES_ID));
  });

  it("filtre par nom, insensible à la casse et par sous-chaîne", async () => {
    await upsertBoulodromes(db, [
      buildTestBoulodrome({ id: ARSENAL_ID, sourceId: ARSENAL_ID, name: "Jardin du port de l'Arsenal" }),
      buildTestBoulodrome({ id: VINCENNES_ID, sourceId: VINCENNES_ID, name: "Terrain de Vincennes" }),
    ]);

    const rows = await findAllBoulodromes(db, { search: "arsenal" });
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(ARSENAL_ID);
    expect(ids).not.toContain(VINCENNES_ID);
  });

  it("filtre par adresse (rue ou ville)", async () => {
    await upsertBoulodromes(db, [
      buildTestBoulodrome({ id: ARSENAL_ID, sourceId: ARSENAL_ID, street: "12 boulevard de la Bastille" }),
      buildTestBoulodrome({ id: VINCENNES_ID, sourceId: VINCENNES_ID, city: "Vincennes" }),
    ]);

    const rows = await findAllBoulodromes(db, { search: "bastille" });
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(ARSENAL_ID);
    expect(ids).not.toContain(VINCENNES_ID);
  });

  it("ne filtre pas quand `search` est absent", async () => {
    await upsertBoulodromes(db, [
      buildTestBoulodrome({ id: ARSENAL_ID, sourceId: ARSENAL_ID }),
      buildTestBoulodrome({ id: VINCENNES_ID, sourceId: VINCENNES_ID }),
    ]);

    const rows = await findAllBoulodromes(db);
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(ARSENAL_ID);
    expect(ids).toContain(VINCENNES_ID);
  });
});

describe("findAllBoulodromes (filtre nature du sol)", () => {
  const SABLE_ID = "test:ground-sable";
  const STABILISE_ID = "test:ground-stabilise";

  afterEach(async () => {
    await db.delete(boulodromes).where(eq(boulodromes.id, SABLE_ID));
    await db.delete(boulodromes).where(eq(boulodromes.id, STABILISE_ID));
  });

  it("filtre par nature du sol exacte", async () => {
    await upsertBoulodromes(db, [
      buildTestBoulodrome({ id: SABLE_ID, sourceId: SABLE_ID, groundType: "Sable" }),
      buildTestBoulodrome({ id: STABILISE_ID, sourceId: STABILISE_ID, groundType: "Stabilisé/cendrée" }),
    ]);

    const rows = await findAllBoulodromes(db, { groundTypes: ["Sable"] });
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(SABLE_ID);
    expect(ids).not.toContain(STABILISE_ID);
  });

  it("accepte plusieurs valeurs (OR)", async () => {
    await upsertBoulodromes(db, [
      buildTestBoulodrome({ id: SABLE_ID, sourceId: SABLE_ID, groundType: "Sable" }),
      buildTestBoulodrome({ id: STABILISE_ID, sourceId: STABILISE_ID, groundType: "Stabilisé/cendrée" }),
    ]);

    const rows = await findAllBoulodromes(db, {
      groundTypes: ["Sable", "Stabilisé/cendrée"],
    });
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(SABLE_ID);
    expect(ids).toContain(STABILISE_ID);
  });

  it("combine recherche texte et filtre de sol (AND)", async () => {
    await upsertBoulodromes(db, [
      buildTestBoulodrome({
        id: SABLE_ID,
        sourceId: SABLE_ID,
        name: "Jardin du port de l'Arsenal",
        groundType: "Sable",
      }),
      buildTestBoulodrome({
        id: STABILISE_ID,
        sourceId: STABILISE_ID,
        name: "Jardin du port de l'Arsenal",
        groundType: "Stabilisé/cendrée",
      }),
    ]);

    const rows = await findAllBoulodromes(db, {
      search: "arsenal",
      groundTypes: ["Sable"],
    });
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(SABLE_ID);
    expect(ids).not.toContain(STABILISE_ID);
  });
});

describe("findAllBoulodromes (filtre type d'équipement)", () => {
  const DECOUVERT_ID = "test:equipment-decouvert";
  const COUVERT_ID = "test:equipment-couvert";

  afterEach(async () => {
    await db.delete(boulodromes).where(eq(boulodromes.id, DECOUVERT_ID));
    await db.delete(boulodromes).where(eq(boulodromes.id, COUVERT_ID));
  });

  it("filtre par type d'équipement exact", async () => {
    await upsertBoulodromes(db, [
      buildTestBoulodrome({ id: DECOUVERT_ID, sourceId: DECOUVERT_ID, equipmentType: "Découvert" }),
      buildTestBoulodrome({ id: COUVERT_ID, sourceId: COUVERT_ID, equipmentType: "Extérieur couvert" }),
    ]);

    const rows = await findAllBoulodromes(db, { equipmentTypes: ["Extérieur couvert"] });
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(COUVERT_ID);
    expect(ids).not.toContain(DECOUVERT_ID);
  });

  it("accepte plusieurs valeurs (OR)", async () => {
    await upsertBoulodromes(db, [
      buildTestBoulodrome({ id: DECOUVERT_ID, sourceId: DECOUVERT_ID, equipmentType: "Découvert" }),
      buildTestBoulodrome({ id: COUVERT_ID, sourceId: COUVERT_ID, equipmentType: "Extérieur couvert" }),
    ]);

    const rows = await findAllBoulodromes(db, {
      equipmentTypes: ["Découvert", "Extérieur couvert"],
    });
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(DECOUVERT_ID);
    expect(ids).toContain(COUVERT_ID);
  });
});

describe("findAllBoulodromes (filtre accès libre)", () => {
  const LIBRE_ID = "test:access-libre";
  const RESTREINT_ID = "test:access-restreint";

  afterEach(async () => {
    await db.delete(boulodromes).where(eq(boulodromes.id, LIBRE_ID));
    await db.delete(boulodromes).where(eq(boulodromes.id, RESTREINT_ID));
  });

  it("filtre les boulodromes en accès libre (freeAccess: true)", async () => {
    await upsertBoulodromes(db, [
      buildTestBoulodrome({ id: LIBRE_ID, sourceId: LIBRE_ID, freeAccess: true }),
      buildTestBoulodrome({ id: RESTREINT_ID, sourceId: RESTREINT_ID, freeAccess: false }),
    ]);

    const rows = await findAllBoulodromes(db, { freeAccess: true });
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(LIBRE_ID);
    expect(ids).not.toContain(RESTREINT_ID);
  });

  it("filtre les boulodromes à accès restreint (freeAccess: false)", async () => {
    await upsertBoulodromes(db, [
      buildTestBoulodrome({ id: LIBRE_ID, sourceId: LIBRE_ID, freeAccess: true }),
      buildTestBoulodrome({ id: RESTREINT_ID, sourceId: RESTREINT_ID, freeAccess: false }),
    ]);

    const rows = await findAllBoulodromes(db, { freeAccess: false });
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(RESTREINT_ID);
    expect(ids).not.toContain(LIBRE_ID);
  });

  it("ne filtre pas quand `freeAccess` est absent", async () => {
    await upsertBoulodromes(db, [
      buildTestBoulodrome({ id: LIBRE_ID, sourceId: LIBRE_ID, freeAccess: true }),
      buildTestBoulodrome({ id: RESTREINT_ID, sourceId: RESTREINT_ID, freeAccess: false }),
    ]);

    const rows = await findAllBoulodromes(db);
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(LIBRE_ID);
    expect(ids).toContain(RESTREINT_ID);
  });
});

describe("findAllBoulodromes (filtre bounding box)", () => {
  const PARIS_ID = "test:bbox-paris";
  const MARSEILLE_ID = "test:bbox-marseille";

  afterEach(async () => {
    await db.delete(boulodromes).where(eq(boulodromes.id, PARIS_ID));
    await db.delete(boulodromes).where(eq(boulodromes.id, MARSEILLE_ID));
  });

  it("filtre les boulodromes dont les coordonnées tombent dans le rectangle", async () => {
    await upsertBoulodromes(db, [
      buildTestBoulodrome({ id: PARIS_ID, sourceId: PARIS_ID, latitude: 48.86, longitude: 2.35 }),
      buildTestBoulodrome({ id: MARSEILLE_ID, sourceId: MARSEILLE_ID, latitude: 43.3, longitude: 5.37 }),
    ]);

    const rows = await findAllBoulodromes(db, {
      boundingBox: { west: 2.2, south: 48.8, east: 2.5, north: 48.9 },
    });
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(PARIS_ID);
    expect(ids).not.toContain(MARSEILLE_ID);
  });

  it("ne filtre pas quand `boundingBox` est absent", async () => {
    await upsertBoulodromes(db, [
      buildTestBoulodrome({ id: PARIS_ID, sourceId: PARIS_ID, latitude: 48.86, longitude: 2.35 }),
      buildTestBoulodrome({ id: MARSEILLE_ID, sourceId: MARSEILLE_ID, latitude: 43.3, longitude: 5.37 }),
    ]);

    const rows = await findAllBoulodromes(db);
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(PARIS_ID);
    expect(ids).toContain(MARSEILLE_ID);
  });
});
