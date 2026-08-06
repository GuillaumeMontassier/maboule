import { eq } from "drizzle-orm";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { app } from "./app";
import { upsertBoulodromes } from "./db/boulodromesRepository";
import { upsertCafes } from "./db/cafesRepository";
import { db } from "./db/client";
import { boulodromes, cafes } from "./db/schema";
import { Boulodrome } from "./models/boulodrome";
import { Cafe } from "./models/cafe";
import { Address, GeoCoordinates } from "./models/geo";

// Tape le vrai Postgres/PostGIS local (docker compose up -d), comme les
// autres *.integration.test.ts - et exerce en plus la route Express
// elle-meme (validation Zod + branchement 404), pas seulement les fonctions
// de repository prises isolement.
describe("GET /api/boulodromes/:id/cafes", () => {
  const BOULODROME_ID = "test:endpoint-boulodrome";
  const NEAR_ID = "test:endpoint-cafe-near"; // ~45m du boulodrome
  const FAR_ID = "test:endpoint-cafe-far"; // ~500m du boulodrome

  const ORIGIN_LAT = 48.8566;
  const ORIGIN_LON = 2.3522;
  // Meme approximation que cafesRepository.integration.test.ts : ~111 196 m
  // par degre de latitude a cette latitude (WGS84).
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
      "Boulodrome de test (endpoint)",
      new Address("1 rue du Test", "75001", "Paris"),
      new GeoCoordinates(ORIGIN_LAT, ORIGIN_LON),
      "manual",
      BOULODROME_ID,
      new Date("2026-08-06T10:00:00.000Z"),
    );
  }

  async function seed(): Promise<void> {
    await upsertBoulodromes(db, [buildTestBoulodrome()]);
    await upsertCafes(db, [buildTestCafeAt(NEAR_ID, 45), buildTestCafeAt(FAR_ID, 500)]);
  }

  afterEach(async () => {
    await db.delete(cafes).where(eq(cafes.id, NEAR_ID));
    await db.delete(cafes).where(eq(cafes.id, FAR_ID));
    await db.delete(boulodromes).where(eq(boulodromes.id, BOULODROME_ID));
  });

  it("renvoie les cafés dans le rayon par défaut (200m)", async () => {
    await seed();

    const response = await request(app).get(`/api/boulodromes/${BOULODROME_ID}/cafes`);

    expect(response.status).toBe(200);
    const ids = response.body.features.map((f: { properties: { id: string } }) => f.properties.id);
    expect(ids).toContain(NEAR_ID);
    expect(ids).not.toContain(FAR_ID);
  });

  it("applique le rayon fourni en query", async () => {
    await seed();

    const response = await request(app).get(`/api/boulodromes/${BOULODROME_ID}/cafes`).query({ radius: 1000 });

    expect(response.status).toBe(200);
    const ids = response.body.features.map((f: { properties: { id: string } }) => f.properties.id);
    expect(ids).toContain(NEAR_ID);
    expect(ids).toContain(FAR_ID);
  });

  it("renvoie 404 pour un boulodrome inconnu", async () => {
    const response = await request(app).get("/api/boulodromes/does-not-exist/cafes");

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
  });

  it("renvoie 400 pour un radius invalide", async () => {
    await seed();

    const response = await request(app)
      .get(`/api/boulodromes/${BOULODROME_ID}/cafes`)
      .query({ radius: -5 });

    expect(response.status).toBe(400);
    expect(response.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "radius" })]),
    );
  });
});
