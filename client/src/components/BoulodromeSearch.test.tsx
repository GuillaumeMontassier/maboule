import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BoulodromeSearch } from "./BoulodromeSearch";
import { fetchBoulodromes } from "../api/boulodromes";
import type { BoulodromesFeatureCollection } from "../api/boulodromes";

vi.mock("../api/boulodromes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/boulodromes")>()),
  fetchBoulodromes: vi.fn(),
}));

function featureFor(id: string, name: string): BoulodromesFeatureCollection["features"][number] {
  return {
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
  };
}

function collectionWithBoulodrome(id: string, name: string): BoulodromesFeatureCollection {
  return { type: "FeatureCollection", features: [featureFor(id, name)] };
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

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

afterEach(() => {
  cleanup();
  vi.mocked(fetchBoulodromes).mockReset();
});

describe("BoulodromeSearch", () => {
  it("déclenche une recherche après un court silence de frappe (debounce), pas une requête par caractère", async () => {
    vi.mocked(fetchBoulodromes).mockResolvedValue(collectionWithBoulodrome("data-es:1", "ARSENAL"));

    render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} />);
    const input = screen.getByLabelText("Rechercher un boulodrome");

    fireEvent.change(input, { target: { value: "a" } });
    fireEvent.change(input, { target: { value: "ar" } });
    fireEvent.change(input, { target: { value: "ars" } });

    await wait(50);
    expect(fetchBoulodromes).not.toHaveBeenCalled();

    expect(await screen.findByText("ARSENAL")).toBeTruthy();
    expect(fetchBoulodromes).toHaveBeenCalledTimes(1);
    expect(fetchBoulodromes).toHaveBeenCalledWith({ search: "ars" });
  });

  it("ne déclenche aucune requête en dessous de 2 caractères saisis", async () => {
    render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} />);
    const input = screen.getByLabelText("Rechercher un boulodrome");

    fireEvent.change(input, { target: { value: "a" } });
    await wait(350);

    expect(fetchBoulodromes).not.toHaveBeenCalled();
  });

  it("ignore une réponse obsolète qui arrive après une recherche plus récente", async () => {
    const firstSearch = defer<BoulodromesFeatureCollection>();
    const secondSearch = defer<BoulodromesFeatureCollection>();
    vi.mocked(fetchBoulodromes).mockReturnValueOnce(firstSearch.promise).mockReturnValueOnce(secondSearch.promise);

    render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} />);
    const input = screen.getByLabelText("Rechercher un boulodrome");

    fireEvent.change(input, { target: { value: "arsenal" } });
    await wait(350);

    fireEvent.change(input, { target: { value: "vincennes" } });
    await wait(350);

    expect(fetchBoulodromes).toHaveBeenCalledTimes(2);

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

  it("affiche l'historique au focus du champ vide", () => {
    const history = [
      { id: "data-es:2", name: "VINCENNES" },
      { id: "data-es:1", name: "ARSENAL" },
    ];

    render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} history={history} />);
    const input = screen.getByLabelText("Rechercher un boulodrome");

    expect(screen.queryByText("VINCENNES")).toBeNull();

    fireEvent.focus(input);

    expect(screen.getByText("VINCENNES")).toBeTruthy();
    expect(screen.getByText("ARSENAL")).toBeTruthy();
  });

  it("n'affiche pas l'historique une fois qu'une saisie est en cours", () => {
    const history = [{ id: "data-es:1", name: "ARSENAL" }];

    render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} history={history} />);
    const input = screen.getByLabelText("Rechercher un boulodrome");

    fireEvent.focus(input);
    expect(screen.getByText("ARSENAL")).toBeTruthy();

    fireEvent.change(input, { target: { value: "a" } });

    expect(screen.queryByText("ARSENAL")).toBeNull();
  });

  it("masque l'historique si le champ vide perd le focus", () => {
    const history = [{ id: "data-es:1", name: "ARSENAL" }];

    render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} history={history} />);
    const input = screen.getByLabelText("Rechercher un boulodrome");

    fireEvent.focus(input);
    expect(screen.getByText("ARSENAL")).toBeTruthy();

    fireEvent.blur(input);

    expect(screen.queryByText("ARSENAL")).toBeNull();
  });

  it("cliquer une entrée de l'historique sélectionne directement ce boulodrome", () => {
    const history = [{ id: "data-es:1", name: "ARSENAL" }];
    const onSelectBoulodrome = vi.fn();

    render(<BoulodromeSearch onSelectBoulodrome={onSelectBoulodrome} history={history} />);
    const input = screen.getByLabelText("Rechercher un boulodrome");

    fireEvent.focus(input);
    fireEvent.click(screen.getByRole("button", { name: "ARSENAL" }));

    expect(onSelectBoulodrome).toHaveBeenCalledExactlyOnceWith("data-es:1");
  });

  it("n'affiche pas la croix d'effacement quand le champ est vide", () => {
    render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Effacer la recherche" })).toBeNull();
  });

  it("affiche la croix d'effacement dès que le champ contient du texte", () => {
    render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} />);
    const input = screen.getByLabelText("Rechercher un boulodrome");

    fireEvent.change(input, { target: { value: "a" } });

    expect(screen.getByRole("button", { name: "Effacer la recherche" })).toBeTruthy();
  });

  it("cliquer la croix vide le champ, referme les résultats et rend le focus au champ", async () => {
    vi.mocked(fetchBoulodromes).mockResolvedValue(collectionWithBoulodrome("data-es:1", "ARSENAL"));

    render(<BoulodromeSearch onSelectBoulodrome={vi.fn()} />);
    const input = screen.getByLabelText("Rechercher un boulodrome");

    fireEvent.change(input, { target: { value: "ars" } });
    await screen.findByText("ARSENAL");

    fireEvent.click(screen.getByRole("button", { name: "Effacer la recherche" }));

    expect((input as HTMLInputElement).value).toBe("");
    expect(screen.queryByText("ARSENAL")).toBeNull();
    expect(document.activeElement).toBe(input);
    expect(screen.queryByRole("button", { name: "Effacer la recherche" })).toBeNull();
  });

  it("Entrée sélectionne directement le premier résultat affiché", async () => {
    vi.mocked(fetchBoulodromes).mockResolvedValue({
      type: "FeatureCollection",
      features: [featureFor("data-es:1", "ARSENAL"), featureFor("data-es:2", "VINCENNES")],
    });
    const onSelectBoulodrome = vi.fn();

    render(<BoulodromeSearch onSelectBoulodrome={onSelectBoulodrome} />);
    const input = screen.getByLabelText("Rechercher un boulodrome");
    const form = input.closest("form")!;

    fireEvent.change(input, { target: { value: "ar" } });
    await screen.findByText("ARSENAL");

    fireEvent.submit(form);

    expect(onSelectBoulodrome).toHaveBeenCalledExactlyOnceWith("data-es:1");
  });
});
