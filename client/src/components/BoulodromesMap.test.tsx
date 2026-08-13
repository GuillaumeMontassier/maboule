import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BoulodromesMap } from "./BoulodromesMap";
import { fetchCafesNearBoulodrome } from "../api/cafes";
import type { CafesFeatureCollection } from "../api/cafes";
import { fetchBoulodromes } from "../api/boulodromes";
import type { BoulodromesFeatureCollection } from "../api/boulodromes";

vi.mock("../api/cafes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/cafes")>()),
  fetchCafesNearBoulodrome: vi.fn(),
}));

vi.mock("../api/boulodromes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/boulodromes")>()),
  fetchBoulodromes: vi.fn(),
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
  vi.mocked(fetchBoulodromes).mockReset();
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

describe("BoulodromesMap - recherche par mot-clé", () => {
  it("affiche les résultats de recherche après la saisie et la validation", async () => {
    vi.mocked(fetchBoulodromes).mockResolvedValue(sampleBoulodromes);

    render(<BoulodromesMap features={sampleBoulodromes} />);

    fireEvent.change(screen.getByLabelText("Rechercher un boulodrome"), {
      target: { value: "arsenal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));

    await waitFor(() => expect(fetchBoulodromes).toHaveBeenCalledWith({ search: "arsenal" }));
    expect(await screen.findByText("AUTRE TERRAIN")).toBeTruthy();
  });

  it("sélectionner un résultat de recherche sélectionne le boulodrome correspondant sur la carte", async () => {
    vi.mocked(fetchBoulodromes).mockResolvedValue(sampleBoulodromes);
    vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes);

    render(<BoulodromesMap features={sampleBoulodromes} />);

    fireEvent.change(screen.getByLabelText("Rechercher un boulodrome"), {
      target: { value: "autre" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));

    const result = await screen.findByRole("button", { name: /AUTRE TERRAIN/ });
    fireEvent.click(result);

    // Meme comportement qu'un clic sur le marqueur : chargement des cafes a
    // proximite du boulodrome selectionne, et popup ouverte sur la carte (le
    // code postal n'apparait que dans la popup, pas dans le resultat de
    // recherche - un moyen fiable de verifier qu'elle s'est bien ouverte).
    await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith("data-es:2"));
    expect(await screen.findByText(/75002/)).toBeTruthy();
  });

  it("affiche un message clair quand la recherche ne retourne aucun résultat", async () => {
    vi.mocked(fetchBoulodromes).mockResolvedValue({ type: "FeatureCollection", features: [] });

    render(<BoulodromesMap features={sampleBoulodromes} />);

    fireEvent.change(screen.getByLabelText("Rechercher un boulodrome"), {
      target: { value: "inexistant" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));

    expect(await screen.findByText("Aucun boulodrome trouvé.")).toBeTruthy();
  });

  it("ignore la sélection d'un résultat dont le boulodrome n'est pas affiché sur la carte (filtré)", async () => {
    // La recherche interroge l'API sans tenir compte des filtres actifs :
    // elle peut renvoyer un boulodrome absent des `features` passées à
    // BoulodromesMap (donc sans marqueur sur la carte).
    const onlyFirstBoulodrome: BoulodromesFeatureCollection = {
      type: "FeatureCollection",
      features: [sampleBoulodromes.features[0]],
    };
    vi.mocked(fetchBoulodromes).mockResolvedValue(sampleBoulodromes);

    render(<BoulodromesMap features={onlyFirstBoulodrome} />);

    fireEvent.change(screen.getByLabelText("Rechercher un boulodrome"), {
      target: { value: "autre" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));

    const result = await screen.findByRole("button", { name: /AUTRE TERRAIN/ });
    fireEvent.click(result);

    // Pas de marqueur pour "data-es:2" -> pas de selection, pas de cafes
    // charges pour un boulodrome invisible sur la carte.
    expect(fetchCafesNearBoulodrome).not.toHaveBeenCalled();
  });
});
