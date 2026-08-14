import { useEffect, useRef, useState, type FormEvent } from "react";
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

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function BoulodromeSearch({ onSelectBoulodrome }: BoulodromeSearchProps) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });
  // Compteur de requetes : une recherche lancee puis abandonnee pour une
  // saisie plus recente ne doit pas ecraser le resultat de cette derniere si
  // sa reponse arrive apres coup (meme principe que le flag `cancelled`
  // utilise pour le chargement des cafes dans BoulodromesMap).
  const latestRequestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      latestRequestId.current += 1;
      setState({ status: "idle" });
      return;
    }

    // Debounce : la requete ne part qu'apres un court silence de saisie, pas
    // a chaque caractere tape.
    const timeoutId = setTimeout(() => {
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
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // La recherche elle-meme se declenche desormais au fil de la frappe (effet
  // ci-dessus) : la soumission du formulaire (bouton ou touche Entree) sert
  // uniquement a selectionner le premier resultat deja affiche.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status === "success" && state.data.features.length > 0) {
      onSelectBoulodrome(state.data.features[0].properties.id);
    }
  }

  return (
    // `md` = 768px par defaut chez Tailwind, meme valeur que le breakpoint du
    // spec : pas de config de breakpoint dediee necessaire.
    <div className="fixed top-3 left-1/2 z-[1000] w-[280px] -translate-x-1/2 text-sm md:left-3 md:translate-x-0">
      <form onSubmit={handleSubmit}>
        <input
          type="search"
          aria-label="Rechercher un boulodrome"
          placeholder="Rechercher un boulodrome…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1.5"
        />
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
