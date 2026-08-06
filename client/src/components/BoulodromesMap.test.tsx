import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { BoulodromesMap } from "./BoulodromesMap";
import { fetchCafesNearBoulodrome } from "../api/cafes";
import type { CafesFeatureCollection } from "../api/cafes";
import type { BoulodromesFeatureCollection } from "../api/boulodromes";

vi.mock("../api/cafes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/cafes")>()),
  fetchCafesNearBoulodrome: vi.fn(),
}));

const sampleBoulodromes: BoulodromesFeatureCollection = {
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
        city: "Paris",
        inseeCode: null,
        siteName: null,
        equipmentType: null,
        groundType: null,
        freeAccess: null,
        source: "data-es",
        lastSyncedAt: "2026-07-24T10:00:00.000Z",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [2.36, 48.86] },
      properties: {
        id: "data-es:2",
        name: "AUTRE TERRAIN",
        street: "2 rue de Paris",
        postalCode: "75002",
        city: "Paris",
        inseeCode: null,
        siteName: null,
        equipmentType: null,
        groundType: null,
        freeAccess: null,
        source: "data-es",
        lastSyncedAt: "2026-07-24T10:00:00.000Z",
      },
    },
  ],
};

const sampleCafes: CafesFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [2.3523, 48.8567] },
      properties: {
        id: "osm:1",
        name: "La Royale",
        amenityType: "bar",
        street: null,
        postalCode: null,
        city: null,
        source: "osm",
        lastSyncedAt: "2026-08-06T10:00:00.000Z",
        distanceMeters: 77,
      },
    },
  ],
};

const emptyCafes: CafesFeatureCollection = { type: "FeatureCollection", features: [] };

afterEach(() => {
  cleanup();
  vi.mocked(fetchCafesNearBoulodrome).mockReset();
});

describe("BoulodromesMap - cafés à proximité", () => {
  it("ne charge aucun café tant qu'aucun boulodrome n'est sélectionné", () => {
    render(<BoulodromesMap features={sampleBoulodromes} />);

    expect(fetchCafesNearBoulodrome).not.toHaveBeenCalled();
  });

  it("charge et affiche les cafés à proximité au clic sur un boulodrome", async () => {
    vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(sampleCafes);

    const { container } = render(<BoulodromesMap features={sampleBoulodromes} />);
    const [marker] = container.querySelectorAll(".leaflet-marker-icon");

    fireEvent.click(marker);

    await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith("data-es:1"));
    await waitFor(() => expect(container.querySelector(".cafe-marker")).toBeTruthy());
  });

  it("retire les marqueurs cafés du boulodrome précédent quand on en sélectionne un autre", async () => {
    vi.mocked(fetchCafesNearBoulodrome).mockResolvedValueOnce(sampleCafes).mockResolvedValueOnce(emptyCafes);

    const { container } = render(<BoulodromesMap features={sampleBoulodromes} />);
    const markers = container.querySelectorAll(".leaflet-marker-icon");

    fireEvent.click(markers[0]);
    await waitFor(() => expect(container.querySelector(".cafe-marker")).toBeTruthy());

    fireEvent.click(markers[1]);

    await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith("data-es:2"));
    await waitFor(() => expect(container.querySelector(".cafe-marker")).toBeNull());
  });
});
