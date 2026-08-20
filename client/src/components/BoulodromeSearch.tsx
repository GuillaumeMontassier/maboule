import { useEffect, useRef, useState, type FocusEvent, type FormEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { fetchBoulodromes, type BoulodromesFeatureCollection } from '../api/boulodromes'
import type { BoulodromeHistoryEntry } from '../hooks/use-boulodrome-history'
import { distinctSiteName } from '../lib/site-name'
import { FOCUS_RING_CLASS, FOCUS_RING_INSET_CLASS } from './focusStyles'

type SearchState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'success'; data: BoulodromesFeatureCollection }

interface BoulodromeSearchProps {
    onSelectBoulodrome: (id: string) => void
    history?: BoulodromeHistoryEntry[]
    onRemoveFromHistory?: (id: string) => void
}

// `siteName` egal a `name` n'apporte rien a afficher en plus - `distinctSiteName`
// applique la meme garde que le popup et le nom accessible des marqueurs dans
// BoulodromesMap.tsx, pour eviter une ligne dupliquee au lieu d'un affichage a
// deux niveaux.
function historySiteName(entry: BoulodromeHistoryEntry): string | null {
    return distinctSiteName(entry.name, entry.siteName)
}

// Fond opaque partage par tous les panneaux flottants du widget (champ +
// cards loading/error/vide/resultats) - un seul token pour les deux, plutot
// que de dupliquer bg-white/dark:bg-gray-800 sur le champ separement (ticket
// 18 : le champ n'avait pas de fond en light mode, laissant transparaitre la
// carte derriere lui).
const SURFACE_CLASS = 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100'

// Chrome de card blanche partagee par les etats loading/error/vide/resultats
// (le padding est omis ici : la liste de resultats n'en a pas, le padding est
// porte par ses boutons enfants au lieu du <ul>).
const STATUS_CARD_CLASS = `mt-1.5 rounded-lg border border-gray-300 shadow-sm dark:border-gray-600 ${SURFACE_CLASS}`

// Style partage par les boutons icone du widget (croix d'effacement du champ,
// croix de suppression d'une entree d'historique).
const ICON_BUTTON_CLASS = 'cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'

const SEARCH_DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

interface SelectableListProps<T> {
    items: T[]
    keyOf: (item: T) => string
    onSelect: (item: T) => void
    renderItem: (item: T) => ReactNode
    // Action secondaire optionnelle (croix de suppression de l'historique,
    // ticket 22) rendue comme bouton frere du bouton de selection, jamais
    // imbriquee dedans : un <button> dans un <button> est invalide en HTML et
    // rendrait le clic ambigu entre les deux actions.
    renderSecondaryAction?: (item: T) => ReactNode
}

// Liste cliquable partagee par l'historique et les resultats de recherche -
// meme chrome visuel (`STATUS_CARD_CLASS` + puces sans bullet, separateurs)
// et meme mecanique de selection au clic, seul le contenu de chaque ligne
// differe entre les deux usages.
function SelectableList<T>({ items, keyOf, onSelect, renderItem, renderSecondaryAction }: SelectableListProps<T>) {
    return (
        <ul
            className={`${STATUS_CARD_CLASS} max-h-60 list-none divide-y divide-gray-200 overflow-y-auto dark:divide-gray-700`}
        >
            {items.map((item) => (
                <li key={keyOf(item)} className="flex items-stretch">
                    <button
                        type="button"
                        onClick={() => onSelect(item)}
                        className={`block flex-1 cursor-pointer px-2.5 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${FOCUS_RING_INSET_CLASS}`}
                    >
                        {renderItem(item)}
                    </button>
                    {renderSecondaryAction?.(item)}
                </li>
            ))}
        </ul>
    )
}

export function BoulodromeSearch({ onSelectBoulodrome, history = [], onRemoveFromHistory }: BoulodromeSearchProps) {
    const [query, setQuery] = useState('')
    const [state, setState] = useState<SearchState>({ status: 'idle' })
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
    const [isFocused, setIsFocused] = useState(false)
    // Interrupteur de fermeture distinct de `isFocused` (ticket 24) : cliquer
    // un item d'une liste (resultat ou historique) deplace le focus vers son
    // <button>, qui reste un descendant du conteneur suivi par isFocused -
    // le focus ne quitte donc jamais le widget et isFocused ne redevient
    // jamais false au moment de la selection. `dismissedAfterSelect` referme
    // les listes explicitement des qu'une selection a lieu, independamment du
    // focus ; il est reinitialise a la prochaine frappe ou au prochain focus
    // du widget pour ne pas bloquer un usage ulterieur normal.
    const [dismissedAfterSelect, setDismissedAfterSelect] = useState(false)
    // Compteur de requetes : une recherche lancee puis abandonnee pour une
    // saisie plus recente ne doit pas ecraser le resultat de cette derniere si
    // sa reponse arrive apres coup (meme principe que le flag `cancelled`
    // utilise pour le chargement des cafes dans BoulodromesMap).
    const latestRequestId = useRef(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const hasQuery = query.trim().length > 0

    useEffect(() => {
        // Toute frappe (nouvelle recherche ou effacement) rouvre la possibilite
        // d'afficher une liste, meme si la derniere action etait une selection.
        setDismissedAfterSelect(false)

        const trimmed = query.trim()
        if (trimmed.length < MIN_QUERY_LENGTH) {
            latestRequestId.current += 1
            setState({ status: 'idle' })
            return
        }

        // Debounce : la requete ne part qu'apres un court silence de saisie, pas
        // a chaque caractere tape.
        const timeoutId = setTimeout(() => {
            const requestId = ++latestRequestId.current
            setState({ status: 'loading' })
            fetchBoulodromes({ search: trimmed })
                .then((data) => {
                    if (requestId === latestRequestId.current) setState({ status: 'success', data })
                })
                .catch((error: unknown) => {
                    if (requestId !== latestRequestId.current) return
                    const message = error instanceof Error ? error.message : 'Erreur inconnue'
                    setState({ status: 'error', message })
                })
        }, SEARCH_DEBOUNCE_MS)

        return () => clearTimeout(timeoutId)
    }, [query])

    // Le focus programmatique pose par `selectAndClose` (voir plus bas) ne doit
    // pas re-ouvrir la liste que l'on vient de fermer : sans ce garde-fou,
    // l'`onFocus` du conteneur (qui reinitialise `dismissedAfterSelect` pour
    // un vrai refocus utilisateur, cf. plus bas) s'appliquerait aussi a ce
    // focus-la, rouvrant immediatement le panneau qu'on cherche a fermer.
    const suppressReopenOnFocusRef = useRef(false)

    // Point d'entree unique de toute selection (clic sur un resultat, clic sur
    // une entree d'historique, Entree sur le premier resultat) - ferme les
    // listes (ticket 24) en plus de propager la selection au parent.
    function selectAndClose(id: string) {
        setDismissedAfterSelect(true)
        onSelectBoulodrome(id)
        // Selectionner un item de liste (clic ou activation clavier) focus ce
        // <button>, retire ensuite du DOM par la fermeture de la liste
        // ci-dessus : sans ce recadrage explicite, le focus quitterait le
        // widget (vers `document.body`), meme raison que le recadrage de
        // `onRemoveFromHistory` plus bas.
        suppressReopenOnFocusRef.current = true
        inputRef.current?.focus()
    }

    // La recherche elle-meme se declenche desormais au fil de la frappe (effet
    // ci-dessus) : la soumission du formulaire (bouton ou touche Entree) sert
    // uniquement a selectionner le premier resultat deja affiche.
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (state.status === 'success' && state.data.features.length > 0) {
            selectAndClose(state.data.features[0].properties.id)
        }
    }

    // Vider le champ met `query` a "" ce qui repasse l'etat en idle via
    // l'effet ci-dessus (trimmed.length < MIN_QUERY_LENGTH) : referme donc les
    // listes de resultats sans logique dediee.
    function handleClear() {
        setQuery('')
        inputRef.current?.focus()
    }

    function handleBlur(event: FocusEvent<HTMLDivElement>) {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsFocused(false)
        }
    }

    return (
        // `md` = 768px par defaut chez Tailwind, meme valeur que le breakpoint du
        // spec : pas de config de breakpoint dediee necessaire.
        // z-[1100], plus haut que le z-[1000] des 3 autres panneaux flottants
        // (filtres, ThemeToggle, RoutePanel) : en mobile le bloc filtres (top-14,
        // App.tsx) chevauche geometriquement la liste ouverte (resultats ou
        // historique) de ce widget, et un z-index a egalite se departage par
        // ordre de peinture (DOM) - qui favorisait jusqu'ici les filtres, rendus
        // apres ce widget dans App.tsx (ticket 25). Bump volontairement cible sur
        // ce seul widget plutot qu'une echelle de z-index partagee : c'est la
        // premiere fois que deux de ces panneaux ont besoin d'un ordre explicite
        // entre eux.
        <div
            className="fixed top-3 left-1/2 z-[1100] w-[280px] -translate-x-1/2 text-sm md:left-3 md:translate-x-0"
            onFocus={() => {
                setIsFocused(true)
                if (suppressReopenOnFocusRef.current) {
                    // Ce focus est le recadrage programmatique de `selectAndClose`,
                    // pas un vrai refocus utilisateur : ne pas rouvrir la liste qu'on
                    // vient de fermer.
                    suppressReopenOnFocusRef.current = false
                } else {
                    // Reprendre le focus sur le widget (ex. re-cliquer le champ apres
                    // une selection) doit reafficher normalement l'historique.
                    setDismissedAfterSelect(false)
                }
            }}
            onBlur={handleBlur}
        >
            <form onSubmit={handleSubmit} className="relative">
                <input
                    ref={inputRef}
                    type="search"
                    aria-label="Rechercher un boulodrome"
                    placeholder="Rechercher un boulodrome…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className={`w-full rounded-md border border-gray-300 px-2 py-1.5 dark:border-gray-600 dark:placeholder-gray-400 ${SURFACE_CLASS} ${hasQuery ? 'pr-7' : ''} ${FOCUS_RING_CLASS}`}
                />
                {hasQuery && (
                    <button
                        type="button"
                        onClick={handleClear}
                        aria-label="Effacer la recherche"
                        className={`absolute top-1/2 right-1.5 -translate-y-1/2 ${ICON_BUTTON_CLASS} ${FOCUS_RING_CLASS}`}
                    >
                        <X size={16} />
                    </button>
                )}
            </form>
            {isFocused && !hasQuery && !dismissedAfterSelect && history.length > 0 && (
                <SelectableList
                    items={history}
                    keyOf={(entry) => entry.id}
                    onSelect={(entry) => selectAndClose(entry.id)}
                    renderItem={(entry) =>
                        historySiteName(entry) ? (
                            <>
                                <strong>{historySiteName(entry)}</strong>
                                <br />
                                <span className="text-xs text-gray-600 dark:text-gray-400">{entry.name}</span>
                            </>
                        ) : (
                            entry.name
                        )
                    }
                    renderSecondaryAction={
                        onRemoveFromHistory &&
                        ((entry) => (
                            <button
                                type="button"
                                onClick={() => {
                                    onRemoveFromHistory(entry.id)
                                    // Le bouton clique est retire du DOM par la suppression : sans
                                    // ce recadrage explicite, le focus quitterait le widget (vers
                                    // `document.body`), ce que `handleBlur` interprete comme une
                                    // perte de focus du widget entier et referme tout le panneau
                                    // (y compris les entrees restantes) au lieu de la seule ligne
                                    // supprimee.
                                    inputRef.current?.focus()
                                }}
                                // Nomme aussi siteName quand il differe de name (pas seulement
                                // name) : deux entrees peuvent partager le meme name sans
                                // partager le meme siteName (raison d'etre du ticket 23), et un
                                // aria-label identique sur leurs deux croix les rendrait
                                // indistinguables au clavier/lecteur d'ecran.
                                aria-label={`Supprimer ${historySiteName(entry) ? `${historySiteName(entry)} ${entry.name}` : entry.name} de l'historique`}
                                className={`px-2 ${ICON_BUTTON_CLASS} ${FOCUS_RING_INSET_CLASS}`}
                            >
                                <X size={14} />
                            </button>
                        ))
                    }
                />
            )}
            {state.status === 'loading' && !dismissedAfterSelect && (
                <p className={`${STATUS_CARD_CLASS} px-2.5 py-1.5`}>Recherche…</p>
            )}
            {state.status === 'error' && !dismissedAfterSelect && (
                <p className={`${STATUS_CARD_CLASS} px-2.5 py-1.5 text-red-700 dark:text-red-400`}>{state.message}</p>
            )}
            {state.status === 'success' && state.data.features.length === 0 && !dismissedAfterSelect && (
                <p className={`${STATUS_CARD_CLASS} px-2.5 py-1.5`}>Aucun boulodrome trouvé.</p>
            )}
            {state.status === 'success' && state.data.features.length > 0 && !dismissedAfterSelect && (
                <SelectableList
                    items={state.data.features}
                    keyOf={(feature) => feature.properties.id}
                    onSelect={(feature) => selectAndClose(feature.properties.id)}
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
    )
}
