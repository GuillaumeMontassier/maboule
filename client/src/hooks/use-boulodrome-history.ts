import { useCallback, useState } from "react";

export interface BoulodromeHistoryEntry {
  id: string;
  name: string;
}

const STORAGE_KEY = "boulodrome-search-history";
const MAX_ENTRIES = 5;

// Deduplique par id (garde la premiere occurrence, donc la plus recente vu
// l'ordre d'appel) et tronque a `MAX_ENTRIES` - applique aussi bien a une
// entree tout juste ajoutee qu'a une lecture depuis localStorage, pour que le
// contenu stocke ne soit jamais tenu pour deja conforme (edite manuellement,
// ecrit par une version differente de l'app, etc.).
function normalizeHistory(entries: BoulodromeHistoryEntry[]): BoulodromeHistoryEntry[] {
  const seen = new Set<string>();
  const deduped: BoulodromeHistoryEntry[] = [];
  for (const entry of entries) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    deduped.push(entry);
  }
  return deduped.slice(0, MAX_ENTRIES);
}

function readStoredHistory(): BoulodromeHistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const validEntries = parsed.filter(
      (entry): entry is BoulodromeHistoryEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as BoulodromeHistoryEntry).id === "string" &&
        typeof (entry as BoulodromeHistoryEntry).name === "string",
    );
    return normalizeHistory(validEntries);
  } catch {
    // localStorage indisponible (navigation privee, quota) ou contenu
    // corrompu : on repart d'un historique vide plutot que de planter.
    return [];
  }
}

// Historique des boulodromes recemment selectionnes, affiche au focus du
// champ de recherche quand il est vide. Persiste en localStorage pour
// survivre aux rechargements de page (cf. spec phase 6, ticket 05).
export function useBoulodromeHistory() {
  const [history, setHistory] = useState<BoulodromeHistoryEntry[]>(readStoredHistory);

  const addToHistory = useCallback((entry: BoulodromeHistoryEntry) => {
    setHistory((current) => {
      // `entry` en tete : une entree deja presente dans `current` est donc
      // ecartee par `normalizeHistory` (premiere occurrence gardee) plutot
      // que dupliquee, et remonte de fait en tete.
      const next = normalizeHistory([entry, ...current]);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Best-effort : la persistance echoue silencieusement (quota,
        // navigation privee), l'historique reste utilisable pour la session.
      }
      return next;
    });
  }, []);

  return { history, addToHistory };
}
