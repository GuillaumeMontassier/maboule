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
    <div className="boulodrome-search">
      <form onSubmit={handleSubmit}>
        <input
          type="search"
          aria-label="Rechercher un boulodrome"
          placeholder="Rechercher un boulodrome…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit" disabled={state.status === "loading"}>
          Rechercher
        </button>
      </form>
      {state.status === "loading" && <p className="boulodrome-search-status">Recherche…</p>}
      {state.status === "error" && (
        <p className="boulodrome-search-status status-error">{state.message}</p>
      )}
      {state.status === "success" && state.data.features.length === 0 && (
        <p className="boulodrome-search-status">Aucun boulodrome trouvé.</p>
      )}
      {state.status === "success" && state.data.features.length > 0 && (
        <ul className="boulodrome-search-results">
          {state.data.features.map((feature) => (
            <li key={feature.properties.id}>
              <button type="button" onClick={() => onSelectBoulodrome(feature.properties.id)}>
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
