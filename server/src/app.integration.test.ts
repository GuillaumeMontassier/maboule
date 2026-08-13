import { eq } from "drizzle-orm";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "./app";
import { upsertBoulodromes } from "./db/boulodromesRepository";
import { upsertCafes } from "./db/cafesRepository";
import { db } from "./db/client";
import { boulodromes, cafes } from "./db/schema";
import { Boulodrome } from "./models/boulodrome";
import { Cafe } from "./models/cafe";
import { Address, GeoCoordinates } from "./models/geo";
import { fetchWalkingRoute, OpenRouteServiceUnavailableError, RouteNotFoundError } from "./routing/openRouteServiceClient";

// Seule frontiere reseau sortante du endpoint /route (cf. ticket) : on mocke
// uniquement fetchWalkingRoute, tout le reste (validation Zod, resolution du
// boulodrome, vrai Postgres/PostGIS) s'execute reellement - meme discipline
// que le reste de ce fichier.
vi.mock("./routing/openRouteServiceClient", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./routing/openRouteServiceClient")>()),
  fetchWalkingRoute: vi.fn(),
}));

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

describe("GET /api/boulodromes/:id/route", () => {
  const BOULODROME_ID = "test:endpoint-boulodrome-route";
  const FROM = "48.8566,2.3522";

  function buildTestBoulodrome(): Boulodrome {
    return new Boulodrome(
      BOULODROME_ID,
      "Boulodrome de test (route)",
      new Address("1 rue du Test", "75001", "Paris"),
      new GeoCoordinates(48.86, 2.36),
      "manual",
      BOULODROME_ID,
      new Date("2026-08-06T10:00:00.000Z"),
    );
  }

  const sampleRoute = {
    type: "Feature" as const,
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [2.3522, 48.8566],
        [2.36, 48.86],
      ] as [number, number][],
    },
    properties: { distanceMeters: 846, durationSeconds: 639 },
  };

  afterEach(async () => {
    vi.mocked(fetchWalkingRoute).mockReset();
    await db.delete(boulodromes).where(eq(boulodromes.id, BOULODROME_ID));
  });

  it("renvoie l'itinéraire calculé par OpenRouteService (cas nominal)", async () => {
    await upsertBoulodromes(db, [buildTestBoulodrome()]);
    vi.mocked(fetchWalkingRoute).mockResolvedValue(sampleRoute);

    const response = await request(app).get(`/api/boulodromes/${BOULODROME_ID}/route`).query({ from: FROM });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(sampleRoute);
    expect(fetchWalkingRoute).toHaveBeenCalledWith(
      new GeoCoordinates(48.8566, 2.3522),
      new GeoCoordinates(48.86, 2.36),
    );
  });

  it("renvoie 404 pour un boulodrome inconnu", async () => {
    const response = await request(app).get("/api/boulodromes/does-not-exist/route").query({ from: FROM });

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
    expect(fetchWalkingRoute).not.toHaveBeenCalled();
  });

  it("renvoie 404 quand OpenRouteService ne trouve aucun itinéraire", async () => {
    await upsertBoulodromes(db, [buildTestBoulodrome()]);
    vi.mocked(fetchWalkingRoute).mockRejectedValue(new RouteNotFoundError("Aucun itinéraire trouvé"));

    const response = await request(app).get(`/api/boulodromes/${BOULODROME_ID}/route`).query({ from: FROM });

    expect(response.status).toBe(404);
    expect(response.body.error).toBeDefined();
  });

  it("renvoie 400 quand from est absent", async () => {
    await upsertBoulodromes(db, [buildTestBoulodrome()]);

    const response = await request(app).get(`/api/boulodromes/${BOULODROME_ID}/route`);

    expect(response.status).toBe(400);
    expect(response.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ path: "from" })]));
  });

  it("renvoie 400 quand from est invalide", async () => {
    await upsertBoulodromes(db, [buildTestBoulodrome()]);

    const response = await request(app)
      .get(`/api/boulodromes/${BOULODROME_ID}/route`)
      .query({ from: "not-a-coordinate" });

    expect(response.status).toBe(400);
    expect(response.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ path: "from" })]));
  });

  it("renvoie 502 quand OpenRouteService échoue", async () => {
    await upsertBoulodromes(db, [buildTestBoulodrome()]);
    vi.mocked(fetchWalkingRoute).mockRejectedValue(new OpenRouteServiceUnavailableError("indisponible"));

    const response = await request(app).get(`/api/boulodromes/${BOULODROME_ID}/route`).query({ from: FROM });

    expect(response.status).toBe(502);
    expect(response.body.error).toBeDefined();
  });
});
