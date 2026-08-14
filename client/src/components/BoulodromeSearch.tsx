import { useEffect, useRef, useState, type FocusEvent, type FormEvent, type ReactNode } from "react";
import { fetchBoulodromes, type BoulodromesFeatureCollection } from "../api/boulodromes";
import type { BoulodromeHistoryEntry } from "../hooks/use-boulodrome-history";

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: BoulodromesFeatureCollection };

interface BoulodromeSearchProps {
  onSelectBoulodrome: (id: string) => void;
  history?: BoulodromeHistoryEntry[];
}

// Chrome de card blanche partagee par les etats loading/error/vide/resultats
// (le padding est omis ici : la liste de resultats n'en a pas, le padding est
// porte par ses boutons enfants au lieu du <ul>).
const STATUS_CARD_CLASS = "mt-1.5 rounded-lg border border-gray-300 bg-white shadow-sm";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

interface SelectableListProps<T> {
  items: T[];
  keyOf: (item: T) => string;
  onSelect: (item: T) => void;
  renderItem: (item: T) => ReactNode;
}

// Liste cliquable partagee par l'historique et les resultats de recherche -
// meme chrome visuel (`STATUS_CARD_CLASS` + puces sans bullet, separateurs)
// et meme mecanique de selection au clic, seul le contenu de chaque ligne
// differe entre les deux usages.
function SelectableList<T>({ items, keyOf, onSelect, renderItem }: SelectableListProps<T>) {
  return (
    <ul className={`${STATUS_CARD_CLASS} max-h-60 list-none divide-y divide-gray-200 overflow-y-auto`}>
      {items.map((item) => (
        <li key={keyOf(item)}>
          <button
            type="button"
            onClick={() => onSelect(item)}
            className="block w-full cursor-pointer px-2.5 py-1.5 text-left hover:bg-gray-100"
          >
            {renderItem(item)}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function BoulodromeSearch({ onSelectBoulodrome, history = [] }: BoulodromeSearchProps) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });
  // Piloté par le focus/blur du widget entier (champ + listes) - l'historique
  // ne s'affiche qu'au focus, champ vide (cf. spec ticket 05). Le focus est
  // suivi au niveau du conteneur plutot que sur le seul champ : `onFocus`/
  // `onBlur` de React bubblent (implementes via focusin/focusout), donc
  // `handleBlur` recoit `relatedTarget` = l'element qui prend le focus, ce
  // qui permet de ne masquer la liste que si le focus quitte vraiment le
  // widget (ex. Tab vers un item de la liste) plutot qu'a chaque perte de
  // focus du champ lui-meme (ce qui rendait la liste inatteignable au
  // clavier : Tab quittait le champ, la liste disparaissait avant que le
  // focus n'atteigne le bouton cible, et le navigateur le reperdait).
  const [isFocused, setIsFocused] = useState(false);
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

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsFocused(false);
    }
  }

  return (
    // `md` = 768px par defaut chez Tailwind, meme valeur que le breakpoint du
    // spec : pas de config de breakpoint dediee necessaire.
    <div
      className="fixed top-3 left-1/2 z-[1000] w-[280px] -translate-x-1/2 text-sm md:left-3 md:translate-x-0"
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
    >
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
      {isFocused && query.trim().length === 0 && history.length > 0 && (
        <SelectableList
          items={history}
          keyOf={(entry) => entry.id}
          onSelect={(entry) => onSelectBoulodrome(entry.id)}
          renderItem={(entry) => entry.name}
        />
      )}
      {state.status === "loading" && <p className={`${STATUS_CARD_CLASS} px-2.5 py-1.5`}>Recherche…</p>}
      {state.status === "error" && (
        <p className={`${STATUS_CARD_CLASS} px-2.5 py-1.5 text-red-700`}>{state.message}</p>
      )}
      {state.status === "success" && state.data.features.length === 0 && (
        <p className={`${STATUS_CARD_CLASS} px-2.5 py-1.5`}>Aucun boulodrome trouvé.</p>
      )}
      {state.status === "success" && state.data.features.length > 0 && (
        <SelectableList
          items={state.data.features}
          keyOf={(feature) => feature.properties.id}
          onSelect={(feature) => onSelectBoulodrome(feature.properties.id)}
          renderItem={(feature) => (
            <>
              <strong>{feature.properties.name}</strong>
              <br />
              {feature.properties.street}, {feature.properties.city}
            </>
          )}
        />
      )}
    </div>
  );
}
