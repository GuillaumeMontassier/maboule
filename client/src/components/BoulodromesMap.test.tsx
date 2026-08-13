import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BoulodromesMap } from "./BoulodromesMap";
import { fetchCafesNearBoulodrome } from "../api/cafes";
import type { CafesFeatureCollection } from "../api/cafes";
import { fetchBoulodromes } from "../api/boulodromes";
import type { BoulodromesFeatureCollection } from "../api/boulodromes";
import { fetchRoute } from "../api/route";
import type { RouteFeature } from "../api/route";
import { fetchGeocodeCandidates } from "../api/geocode";
import type { GeocodeCandidate } from "../api/geocode";

vi.mock("../api/cafes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/cafes")>()),
  fetchCafesNearBoulodrome: vi.fn(),
}));

vi.mock("../api/boulodromes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/boulodromes")>()),
  fetchBoulodromes: vi.fn(),
}));

vi.mock("../api/route", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/route")>()),
  fetchRoute: vi.fn(),
}));

vi.mock("../api/geocode", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/geocode")>()),
  fetchGeocodeCandidates: vi.fn(),
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

const sampleRoute: RouteFeature = {
  type: "Feature",
  geometry: {
    type: "LineString",
    coordinates: [
      [2.3522, 48.8566],
      [2.353, 48.857],
    ],
  },
  properties: { distanceMeters: 846, durationSeconds: 639 },
};

// jsdom n'implemente pas navigator.geolocation - on la simule pour piloter
// succes/echec depuis les tests, comme on mocke `fetchRoute`/`fetchCafesNearBoulodrome`
// a la frontiere reseau.
function stubGeolocation(
  behavior: (
    onSuccess: PositionCallback,
    onError: PositionErrorCallback | undefined,
  ) => void,
) {
  Object.defineProperty(window.navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition: vi.fn(behavior) },
  });
}

function fakePosition(latitude: number, longitude: number): GeolocationPosition {
  return {
    coords: {
      latitude,
      longitude,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({}),
    },
    timestamp: Date.now(),
    toJSON: () => ({}),
  } as GeolocationPosition;
}

const singleCandidate: GeocodeCandidate[] = [
  { label: "12 Rue de Rivoli, 75001 Paris", coordinates: { latitude: 48.856, longitude: 2.351 } },
];

const ambiguousCandidates: GeocodeCandidate[] = [
  { label: "12 Rue de Rivoli, 75001 Paris", coordinates: { latitude: 48.856, longitude: 2.351 } },
  { label: "12 Rue de Rivoli, 69001 Lyon", coordinates: { latitude: 45.767, longitude: 4.834 } },
];

afterEach(() => {
  cleanup();
  vi.mocked(fetchCafesNearBoulodrome).mockReset();
  vi.mocked(fetchBoulodromes).mockReset();
  vi.mocked(fetchRoute).mockReset();
  vi.mocked(fetchGeocodeCandidates).mockReset();
  Reflect.deleteProperty(window.navigator, "geolocation");
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

describe("BoulodromesMap - itinéraire depuis la position GPS", () => {
  it("demande d'itinéraire depuis la position GPS -> tracé affiché", async () => {
    vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes);
    vi.mocked(fetchRoute).mockResolvedValue(sampleRoute);
    stubGeolocation((onSuccess) => onSuccess(fakePosition(48.85, 2.35)));

    const { container } = render(<BoulodromesMap features={sampleBoulodromes} />);
    const [marker] = container.querySelectorAll(".leaflet-marker-icon");
    fireEvent.click(marker);

    const useLocationButton = await screen.findByRole("button", { name: "Utiliser ma position" });
    fireEvent.click(useLocationButton);

    await waitFor(() =>
      expect(fetchRoute).toHaveBeenCalledWith("data-es:1", { latitude: 48.85, longitude: 2.35 }),
    );
    await waitFor(() => expect(container.querySelector(".route-start-marker")).toBeTruthy());
    expect(await screen.findByText(/846 m/)).toBeTruthy();
  });

  it("permission GPS refusée -> message affiché, aucun appel réseau", async () => {
    vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes);
    stubGeolocation((_onSuccess, onError) => {
      onError?.({
        code: 1,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
        message: "denied",
      } as GeolocationPositionError);
    });

    const { container } = render(<BoulodromesMap features={sampleBoulodromes} />);
    const [marker] = container.querySelectorAll(".leaflet-marker-icon");
    fireEvent.click(marker);

    const useLocationButton = await screen.findByRole("button", { name: "Utiliser ma position" });
    fireEvent.click(useLocationButton);

    expect(await screen.findByText(/Géolocalisation refusée/)).toBeTruthy();
    expect(fetchRoute).not.toHaveBeenCalled();
  });

  it("changement de boulodrome sélectionné -> tracé retiré", async () => {
    vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes);
    vi.mocked(fetchRoute).mockResolvedValue(sampleRoute);
    stubGeolocation((onSuccess) => onSuccess(fakePosition(48.85, 2.35)));

    const { container } = render(<BoulodromesMap features={sampleBoulodromes} />);
    const markers = container.querySelectorAll(".leaflet-marker-icon");

    fireEvent.click(markers[0]);
    fireEvent.click(await screen.findByRole("button", { name: "Utiliser ma position" }));
    await waitFor(() => expect(container.querySelector(".route-start-marker")).toBeTruthy());

    fireEvent.click(markers[1]);

    await waitFor(() => expect(container.querySelector(".route-start-marker")).toBeNull());
  });

  it("une réponse d'itinéraire tardive pour le boulodrome précédent n'écrase pas la sélection actuelle", async () => {
    vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes);
    let resolvePendingRoute: ((route: RouteFeature) => void) | undefined;
    vi.mocked(fetchRoute).mockImplementationOnce(
      () => new Promise((resolve) => (resolvePendingRoute = resolve)),
    );
    stubGeolocation((onSuccess) => onSuccess(fakePosition(48.85, 2.35)));

    const { container } = render(<BoulodromesMap features={sampleBoulodromes} />);
    const markers = container.querySelectorAll(".leaflet-marker-icon");

    fireEvent.click(markers[0]);
    fireEvent.click(await screen.findByRole("button", { name: "Utiliser ma position" }));
    await waitFor(() =>
      expect(fetchRoute).toHaveBeenCalledWith("data-es:1", { latitude: 48.85, longitude: 2.35 }),
    );

    // Changement de boulodrome avant que la requete du premier ne resolve -
    // le panneau "data-es:1" est demonte (remplace par celui de "data-es:2").
    fireEvent.click(markers[1]);
    await waitFor(() => expect(fetchCafesNearBoulodrome).toHaveBeenCalledWith("data-es:2"));

    // La reponse tardive de "data-es:1" ne doit pas redessiner son trace
    // maintenant que "data-es:2" est selectionne (course entre l'ancienne
    // instance de RoutePanel et sa reponse reseau en vol).
    await act(async () => resolvePendingRoute?.(sampleRoute));

    expect(container.querySelector(".route-start-marker")).toBeNull();
  });

  it("une erreur de géolocalisation après un itinéraire déjà affiché retire le tracé", async () => {
    vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes);
    vi.mocked(fetchRoute).mockResolvedValue(sampleRoute);
    stubGeolocation((onSuccess) => onSuccess(fakePosition(48.85, 2.35)));

    const { container } = render(<BoulodromesMap features={sampleBoulodromes} />);
    const [marker] = container.querySelectorAll(".leaflet-marker-icon");
    fireEvent.click(marker);

    const useLocationButton = await screen.findByRole("button", { name: "Utiliser ma position" });
    fireEvent.click(useLocationButton);
    await waitFor(() => expect(container.querySelector(".route-start-marker")).toBeTruthy());

    // Deuxieme demande (ex. rafraichissement de position), cette fois en echec.
    stubGeolocation((_onSuccess, onError) => {
      onError?.({
        code: 1,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
        message: "denied",
      } as GeolocationPositionError);
    });
    fireEvent.click(useLocationButton);

    await waitFor(() => expect(container.querySelector(".route-start-marker")).toBeNull());
    expect(await screen.findByText(/Géolocalisation refusée/)).toBeTruthy();
  });
});

describe("BoulodromesMap - itinéraire depuis une adresse recherchée", () => {
  async function selectBoulodromeAndSearchAddress(container: HTMLElement, query: string) {
    const [marker] = container.querySelectorAll(".leaflet-marker-icon");
    fireEvent.click(marker);

    fireEvent.change(await screen.findByLabelText("Adresse de départ"), {
      target: { value: query },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rechercher l'adresse" }));
  }

  it("adresse avec un seul résultat -> itinéraire affiché directement", async () => {
    vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes);
    vi.mocked(fetchGeocodeCandidates).mockResolvedValue(singleCandidate);
    vi.mocked(fetchRoute).mockResolvedValue(sampleRoute);

    const { container } = render(<BoulodromesMap features={sampleBoulodromes} />);
    await selectBoulodromeAndSearchAddress(container, "12 rue de rivoli");

    await waitFor(() =>
      expect(fetchRoute).toHaveBeenCalledWith("data-es:1", { latitude: 48.856, longitude: 2.351 }),
    );
    await waitFor(() => expect(container.querySelector(".route-start-marker")).toBeTruthy());
    expect(await screen.findByText(/846 m/)).toBeTruthy();
  });

  it("adresse ambiguë -> liste de choix affichée puis sélection -> itinéraire affiché", async () => {
    vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes);
    vi.mocked(fetchGeocodeCandidates).mockResolvedValue(ambiguousCandidates);
    vi.mocked(fetchRoute).mockResolvedValue(sampleRoute);

    const { container } = render(<BoulodromesMap features={sampleBoulodromes} />);
    await selectBoulodromeAndSearchAddress(container, "12 rue de rivoli");

    expect(fetchRoute).not.toHaveBeenCalled();
    const lyonOption = await screen.findByRole("button", { name: /69001 Lyon/ });

    fireEvent.click(lyonOption);

    await waitFor(() =>
      expect(fetchRoute).toHaveBeenCalledWith("data-es:1", { latitude: 45.767, longitude: 4.834 }),
    );
    expect(await screen.findByText(/846 m/)).toBeTruthy();
  });

  it("adresse sans résultat -> message affiché", async () => {
    vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes);
    vi.mocked(fetchGeocodeCandidates).mockRejectedValue(
      new Error("Aucune adresse ne correspond à cette recherche."),
    );

    const { container } = render(<BoulodromesMap features={sampleBoulodromes} />);
    await selectBoulodromeAndSearchAddress(container, "adresse inexistante");

    expect(await screen.findByText(/Aucune adresse ne correspond/)).toBeTruthy();
    expect(fetchRoute).not.toHaveBeenCalled();
  });

  it("une nouvelle recherche d'adresse ambiguë retire le tracé déjà affiché en attendant un choix", async () => {
    vi.mocked(fetchCafesNearBoulodrome).mockResolvedValue(emptyCafes);
    vi.mocked(fetchGeocodeCandidates).mockResolvedValueOnce(singleCandidate).mockResolvedValueOnce(ambiguousCandidates);
    vi.mocked(fetchRoute).mockResolvedValue(sampleRoute);

    const { container } = render(<BoulodromesMap features={sampleBoulodromes} />);
    await selectBoulodromeAndSearchAddress(container, "12 rue de rivoli");
    await waitFor(() => expect(container.querySelector(".route-start-marker")).toBeTruthy());

    // Deuxieme recherche, cette fois ambigue : le trace de la premiere
    // adresse (deja affiche) ne doit pas rester sur la carte pendant que
    // l'utilisateur choisit parmi les candidats de la seconde recherche.
    fireEvent.change(screen.getByLabelText("Adresse de départ"), {
      target: { value: "12 rue de rivoli" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rechercher l'adresse" }));

    await screen.findByRole("button", { name: /69001 Lyon/ });
    expect(container.querySelector(".route-start-marker")).toBeNull();
  });
});
