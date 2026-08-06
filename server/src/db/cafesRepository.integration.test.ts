import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { upsertBoulodromes } from "./boulodromesRepository";
import { Boulodrome } from "../models/boulodrome";
import { Cafe } from "../models/cafe";
import { Address, GeoCoordinates } from "../models/geo";
import { findAllCafes, findCafesNearBoulodrome, upsertCafes } from "./cafesRepository";
import { db } from "./client";
import { boulodromes, cafes } from "./schema";

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

describe("findCafesNearBoulodrome", () => {
  const BOULODROME_ID = "test:proximity-boulodrome";
  const NEAR_ID = "test:proximity-cafe-near"; // ~45m du boulodrome
  const MID_ID = "test:proximity-cafe-mid"; // ~145m du boulodrome
  const FAR_ID = "test:proximity-cafe-far"; // ~500m du boulodrome

  const ORIGIN_LAT = 48.8566;
  const ORIGIN_LON = 2.3522;
  // ~111 196 m par degre de latitude a cette latitude (formule WGS84) : on
  // decale uniquement la latitude pour placer chaque cafe a une distance
  // nord-sud connue du boulodrome, sans avoir a gerer la conversion en
  // longitude (qui varie avec la latitude, contrairement a celle-ci).
  const METERS_PER_DEGREE_LATITUDE = 111196;

  function offsetLatitude(meters: number): number {
    return ORIGIN_LAT + meters / METERS_PER_DEGREE_LATITUDE;
  }

  function buildTestCafeAt(id: string, meters: number): Cafe {
    return new Cafe(
      id,
      id,
      "cafe",
      new GeoCoordinates(offsetLatitude(meters), ORIGIN_LON),
      "manual",
      id,
      new Date("2026-08-06T10:00:00.000Z"),
      null,
    );
  }

  function buildTestBoulodrome(): Boulodrome {
    return new Boulodrome(
      BOULODROME_ID,
      "Boulodrome de test (proximité)",
      new Address("1 rue du Test", "75001", "Paris"),
      new GeoCoordinates(ORIGIN_LAT, ORIGIN_LON),
      "manual",
      BOULODROME_ID,
      new Date("2026-08-06T10:00:00.000Z"),
    );
  }

  async function seed(): Promise<void> {
    await upsertBoulodromes(db, [buildTestBoulodrome()]);
    await upsertCafes(db, [
      buildTestCafeAt(NEAR_ID, 45),
      buildTestCafeAt(MID_ID, 145),
      buildTestCafeAt(FAR_ID, 500),
    ]);
  }

  afterEach(async () => {
    await db.delete(cafes).where(eq(cafes.id, NEAR_ID));
    await db.delete(cafes).where(eq(cafes.id, MID_ID));
    await db.delete(cafes).where(eq(cafes.id, FAR_ID));
    await db.delete(boulodromes).where(eq(boulodromes.id, BOULODROME_ID));
  });

  it("inclut les cafés dans le rayon donné et exclut ceux au-delà", async () => {
    await seed();

    const rows = await findCafesNearBoulodrome(db, BOULODROME_ID, 200);
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(NEAR_ID);
    expect(ids).toContain(MID_ID);
    expect(ids).not.toContain(FAR_ID);
  });

  it("resserre les résultats avec un rayon plus strict (seuil de distance)", async () => {
    await seed();

    const rows = await findCafesNearBoulodrome(db, BOULODROME_ID, 100);
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(NEAR_ID);
    expect(ids).not.toContain(MID_ID);
    expect(ids).not.toContain(FAR_ID);
  });

  it("trie les résultats du plus proche au plus loin et renvoie une distance cohérente", async () => {
    await seed();

    const rows = await findCafesNearBoulodrome(db, BOULODROME_ID, 200);
    // Le point de test est en plein Paris : de vrais cafés OSM (deja
    // ingeres, cf. cafesRepository.ts) tombent aussi dans ce rayon. On ne
    // garde que nos cafes de test pour verifier l'ordre entre eux, l'ordre
    // global (par distance croissante) etant lui deja garanti par le tri SQL.
    const testRows = rows.filter((r) => [NEAR_ID, MID_ID].includes(r.id));

    expect(testRows.map((r) => r.id)).toEqual([NEAR_ID, MID_ID]);
    // Tolerance large : ST_Distance fait un calcul spheroidal exact, notre
    // conversion degres/metres ci-dessus n'est qu'une approximation locale.
    expect(testRows[0].distanceMeters).toBeGreaterThan(30);
    expect(testRows[0].distanceMeters).toBeLessThan(60);
    expect(testRows[1].distanceMeters).toBeGreaterThan(120);
    expect(testRows[1].distanceMeters).toBeLessThan(170);
  });

  it("renvoie une liste vide pour un boulodrome inconnu", async () => {
    await seed();

    const rows = await findCafesNearBoulodrome(db, "test:does-not-exist", 200);

    expect(rows).toEqual([]);
  });
});
