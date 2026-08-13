import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BoulodromeSearch } from "./BoulodromeSearch";
import { fetchBoulodromes } from "../api/boulodromes";
import type { BoulodromesFeatureCollection } from "../api/boulodromes";

vi.mock("../api/boulodromes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/boulodromes")>()),
  fetchBoulodromes: vi.fn(),
}));

function collectionWithBoulodrome(id: string, name: string): BoulodromesFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [2.3522, 48.8566] },
        properties: {
          id,
          name,
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
    ],
  };
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function defer<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

afterEach(() => {
  cleanup();
  vi.mocked(fetchBoulodromes).mockReset();
});

describe("BoulodromeSearch", () => {
  it("ignore une réponse obsolète qui arrive après une recherche plus récente", async () => {
    const firstSearch = defer<BoulodromesFeatureCollection>();
    const secondSearch = defer<BoulodromesFeatureCollection>();
    vi.mocked(fetchBoulodromes).mockReturnValueOnce(firstSearch.promise).mockReturnValueOnce(secondSearch.promise);

    render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} />);
    const input = screen.getByLabelText("Rechercher un boulodrome");
    const form = input.closest("form")!;

    fireEvent.change(input, { target: { value: "arsenal" } });
    fireEvent.submit(form);

    fireEvent.change(input, { target: { value: "vincennes" } });
    fireEvent.submit(form);

    // La deuxieme recherche (plus recente) repond en premier.
    secondSearch.resolve(collectionWithBoulodrome("data-es:2", "VINCENNES"));
    expect(await screen.findByText("VINCENNES")).toBeTruthy();

    // La premiere recherche (abandonnee) repond ensuite, en retard : elle ne
    // doit pas ecraser le resultat de la recherche plus recente deja affiche.
    firstSearch.resolve(collectionWithBoulodrome("data-es:1", "ARSENAL"));
    await Promise.resolve();
    await Promise.resolve();

    expect(screen.queryByText("ARSENAL")).toBeNull();
    expect(screen.getByText("VINCENNES")).toBeTruthy();
  });
});
