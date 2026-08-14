import { useRef, useState, type FormEvent } from "react";
import { fetchBoulodromes, type BoulodromesFeatureCollection } from "../api/boulodromes";

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: BoulodromesFeatureCollection };

interface BoulodromeSearchProps {
  onSelectBoulodrome: (id: string) => void;
}

// Chrome de card blanche partagee par les etats loading/error/vide/resultats
// (le padding est omis ici : la liste de resultats n'en a pas, le padding est
// porte par ses boutons enfants au lieu du <ul>).
const STATUS_CARD_CLASS = "mt-1.5 rounded-lg border border-gray-300 bg-white shadow-sm";

export function BoulodromeSearch({ onSelectBoulodrome }: BoulodromeSearchProps) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });
  // Compteur de requetes : une recherche lancee puis abandonnee pour une
  // nouvelle saisie ne doit pas ecraser le resultat de la recherche plus
  // recente si sa reponse arrive apres coup (meme principe que le flag
  // `cancelled` utilise pour le chargement des cafes dans BoulodromesMap).
  const latestRequestId = useRef(0);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      latestRequestId.current += 1;
      setState({ status: "idle" });
      return;
    }

    const requestId = ++latestRequestId.current;
    setState({ status: "loading" });
    fetchBoulodromes({ search: trimmed })
      .then((data) => {
        if (requestId === latestRequestId.current) setState({ status: "success", data });
      })
      .catch((error: unknown) => {
        if (requestId !== latestRequestId.current) return;
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        setState({ status: "error", message });
      });
  }

  return (
    // `md` = 768px par defaut chez Tailwind, meme valeur que le breakpoint du
    // spec : pas de config de breakpoint dediee necessaire.
    <div className="fixed top-3 left-1/2 z-[1000] w-[280px] -translate-x-1/2 text-sm md:left-3 md:translate-x-0">
      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <input
          type="search"
          aria-label="Rechercher un boulodrome"
          placeholder="Rechercher un boulodrome…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-2 py-1.5"
        />
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="rounded-md border border-gray-300 bg-gray-100 px-2 py-1.5 disabled:cursor-default disabled:opacity-60"
        >
          Rechercher
        </button>
      </form>
      {state.status === "loading" && <p className={`${STATUS_CARD_CLASS} px-2.5 py-1.5`}>Recherche…</p>}
      {state.status === "error" && (
        <p className={`${STATUS_CARD_CLASS} px-2.5 py-1.5 text-red-700`}>{state.message}</p>
      )}
      {state.status === "success" && state.data.features.length === 0 && (
        <p className={`${STATUS_CARD_CLASS} px-2.5 py-1.5`}>Aucun boulodrome trouvé.</p>
      )}
      {state.status === "success" && state.data.features.length > 0 && (
        <ul className={`${STATUS_CARD_CLASS} max-h-60 list-none divide-y divide-gray-200 overflow-y-auto`}>
          {state.data.features.map((feature) => (
            <li key={feature.properties.id}>
              <button
                type="button"
                onClick={() => onSelectBoulodrome(feature.properties.id)}
                className="block w-full cursor-pointer px-2.5 py-1.5 text-left hover:bg-gray-100"
              >
                <strong>{feature.properties.name}</strong>
                <br />
                {feature.properties.street}, {feature.properties.city}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
