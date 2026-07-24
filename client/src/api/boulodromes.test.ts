import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchBoulodromes } from "./boulodromes";

const sampleCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [2.3522, 48.8566] },
      properties: {
        id: "data-es:1",
        name: "TERRAIN DE PETANQUE",
        street: "1 rue de Paris",
        postalCode: "75001",
        city: "Paris 1er Arrondissement",
        inseeCode: "75101",
        source: "data-es",
        lastSyncedAt: "2026-07-24T10:00:00.000Z",
      },
    },
  ],
} as const;

describe("fetchBoulodromes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retourne le JSON de la réponse quand l'appel réussit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleCollection),
      }),
    );

    const result = await fetchBoulodromes();

    expect(result).toEqual(sampleCollection);
  });

  it("lève une erreur quand la réponse n'est pas ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    await expect(fetchBoulodromes()).rejects.toThrow("500");
  });
});
