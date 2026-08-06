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
    name: string;
    latitude: number;
    longitude: number;
    siteName: string | null;
    equipmentType: string | null;
    groundType: string | null;
    freeAccess: boolean | null;
  }> = {},
): Boulodrome {
  return new Boulodrome(
    TEST_ID,
    overrides.name ?? "Boulodrome de test",
    new Address("1 rue du Test", "75001", "Paris 1er Arrondissement", "75101"),
    new GeoCoordinates(overrides.latitude ?? 48.8566, overrides.longitude ?? 2.3522),
    "manual",
    "integration-test",
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
