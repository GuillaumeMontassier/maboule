import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { Cafe } from "../models/cafe";
import { Address, GeoCoordinates } from "../models/geo";
import { findAllCafes, upsertCafes } from "./cafesRepository";
import { db } from "./client";
import { cafes } from "./schema";

// Meme principe que boulodromesRepository.integration.test.ts : ces tests
// tapent le vrai Postgres/PostGIS local (docker compose up -d).
const TEST_ID = "test:integration-cafe";

function buildTestCafe(
  overrides: Partial<{
    name: string;
    latitude: number;
    longitude: number;
    address: Address | null;
  }> = {},
): Cafe {
  return new Cafe(
    TEST_ID,
    overrides.name ?? "Café de test",
    "cafe",
    new GeoCoordinates(overrides.latitude ?? 48.8566, overrides.longitude ?? 2.3522),
    "manual",
    "integration-test",
    new Date("2026-08-06T10:00:00.000Z"),
    // `??` traiterait un `address: null` explicite comme "non fourni" et
    // retomberait sur la valeur par defaut - il faut distinguer "absent"
    // (undefined) de "explicitement sans adresse" (null).
    overrides.address !== undefined ? overrides.address : new Address("1 rue du Test", "75001", "Paris"),
  );
}

afterEach(async () => {
  await db.delete(cafes).where(eq(cafes.id, TEST_ID));
});

describe("cafesRepository (integration)", () => {
  it("insère puis relit un café avec les coordonnées exactes (round-trip PostGIS)", async () => {
    await upsertCafes(db, [buildTestCafe()]);

    const rows = await findAllCafes(db);
    const row = rows.find((r) => r.id === TEST_ID);

    expect(row).toBeDefined();
    expect(row?.name).toBe("Café de test");
    expect(row?.amenityType).toBe("cafe");
    expect(row?.longitude).toBeCloseTo(2.3522, 6);
    expect(row?.latitude).toBeCloseTo(48.8566, 6);
    expect(row?.street).toBe("1 rue du Test");
    expect(row?.postalCode).toBe("75001");
    expect(row?.city).toBe("Paris");
  });

  it("accepte une adresse absente (colonnes nullable)", async () => {
    await upsertCafes(db, [buildTestCafe({ address: null })]);

    const rows = await findAllCafes(db);
    const row = rows.find((r) => r.id === TEST_ID);

    expect(row?.street).toBeNull();
    expect(row?.postalCode).toBeNull();
    expect(row?.city).toBeNull();
  });

  it("met à jour la ligne existante plutôt que d'en créer une nouvelle (upsert)", async () => {
    await upsertCafes(db, [buildTestCafe({ name: "Premier nom" })]);
    await upsertCafes(db, [buildTestCafe({ name: "Nom mis à jour" })]);

    const rows = await findAllCafes(db);
    const matching = rows.filter((r) => r.id === TEST_ID);

    expect(matching).toHaveLength(1);
    expect(matching[0].name).toBe("Nom mis à jour");
  });
});
