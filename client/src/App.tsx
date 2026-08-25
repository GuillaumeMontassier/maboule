import { useMemo, useState } from 'react'
import { BoulodromesMap } from './components/BoulodromesMap'
import { PillFilterGroup } from './components/PillFilterGroup'
import { AccessFilter } from './components/AccessFilter'
import { ThemeToggle } from './components/ThemeToggle'
import { FOCUS_RING_CLASS } from './components/focusStyles'
import { FLOATING_SURFACE_CLASS, STATUS_ERROR_TEXT_CLASS } from './components/surfaceStyles'
import { EQUIPMENT_TYPES, GROUND_TYPES } from './constants/boulodromeFilters'
import { describeBoulodromesState, useBoulodromes } from './hooks/use-boulodromes'
import './App.css'

function App() {
    const [groundTypes, setGroundTypes] = useState<string[]>([])
    const [equipmentTypes, setEquipmentTypes] = useState<string[]>([])
    const [freeAccess, setFreeAccess] = useState<boolean | undefined>(undefined)
    // Memoise pour que `useBoulodromes` (dont le filtrage en memoire depend de
    // cet objet par reference) ne refiltre pas a chaque rendu de `App` - sans
    // ca, un objet litteral neuf a chaque rendu invaliderait son `useMemo`
    // meme quand aucun filtre n'a reellement change.
    const filters = useMemo(
        () => ({ groundTypes, equipmentTypes, freeAccess }),
        [groundTypes, equipmentTypes, freeAccess]
    )
    const { features, state, setBbox } = useBoulodromes(filters)

    // Un seul message a la fois (ticket 37) : le tout premier chargement est
    // bloquant (rien a montrer), un rechargement en arriere-plan (pan/zoom
    // apres un premier succes) reste silencieux sauf en cas d'echec, auquel
    // cas ce message est transitoire - il disparait de lui-meme des que le
    // rechargement suivant reussit (`refetchError` repasse a `null`). Logique
    // de traduction colocalisee avec `BoulodromesState`
    // (`describeBoulodromesState`, use-boulodromes.ts) plutot qu'eparpillee
    // ici en ternaires.
    const { message: statusMessage, isError: statusIsError } = describeBoulodromesState(state)
    const statusClass = [
        'fixed bottom-3 left-1/2 z-[1000] -translate-x-1/2 px-3 py-2 text-sm',
        FLOATING_SURFACE_CLASS,
        statusIsError ? STATUS_ERROR_TEXT_CLASS : ''
    ]
        .filter(Boolean)
        .join(' ')

    const hasActiveFilters = groundTypes.length > 0 || equipmentTypes.length > 0 || freeAccess !== undefined

    function resetFilters() {
        setGroundTypes([])
        setEquipmentTypes([])
        setFreeAccess(undefined)
    }

    return (
        <>
            <ThemeToggle />
            {/* `BoulodromesMap` reste monte en permanence, quel que soit l'etat du
          fetch bbox-scope (ticket 36) - contrairement a l'ancien rendu
          conditionnel loading/success/error qui la demontait/remontait a
          chaque changement de filtre, reinitialisant le zoom/pan Leaflet a
          `PARIS_CENTER`/12 a chaque fois (cause du "dezoom au filtre"
          signale par l'utilisateur, cf. ADR 0004). Petite carte flottante
          plutot qu'un bloc plein-ecran (ticket 37) : l'ancien bloc `.status`
          (`height: 100vh`, flux normal) datait du rendu conditionnel
          ci-dessus et repoussait la carte hors ecran a chaque rechargement
          une fois celle-ci montee en permanence - visible uniquement pour le
          tout premier chargement ou un rechargement en echec, jamais pour un
          rechargement reussi (silencieux, cf. `useBoulodromes`). */}
            {statusMessage !== null && <p className={statusClass}>{statusMessage}</p>}
            <BoulodromesMap features={features} onBoundsChange={setBbox} />
            {/* Rendu après BoulodromesMap (donc après la recherche dans l'ordre du
          DOM) plutôt qu'avant : la recherche est l'action principale,
          positionnée en premier visuellement (haut-gauche desktop, au-dessus
          des filtres en mobile) - l'ordre de tabulation doit suivre la même
          hiérarchie plutôt que de faire passer les filtres (secondaires)
          avant elle (ticket 15). Position CSS `fixed` : cet ordre de DOM
          n'affecte que la tabulation, pas l'empilement visuel - la liste
          déroulante de la recherche (résultats/historique) chevauche
          géométriquement ce bloc filtres en mobile une fois ouverte, d'où le
          `z-[1100]` explicite du widget de recherche (BoulodromeSearch.tsx)
          qui l'emporte désormais sur ce bloc plutôt que de dépendre de
          l'ordre de peinture (ticket 25). */}
            {/* Pleine largeur sous la recherche, meme position relative en mobile
          et en desktop (ticket 34) - avant, les filtres se tenaient a cote de
          la recherche en desktop (`md:left-[300px]`), mais les pilules-groupe
          (31/32) elargissent trop la rangee pour tenir a cote d'elle sur un
          laptop/tablette (1024px). */}
            <div className="fixed top-14 left-3 right-3 z-[1000] flex items-center gap-1.5 text-sm">
                {/* `min-w-0` : sans ca, un enfant flex garde sa largeur de contenu
              comme largeur minimale et ne cede jamais la place au bouton
              reset (`shrink-0` ci-dessous) - `overflow-x-auto` + `flex-nowrap`
              (pas `flex-wrap`) : en mobile, la rangee scrolle horizontalement
              plutot que de retomber sur plusieurs lignes - `shrink-0` sur
              chaque groupe (`PILL_GROUP_CONTAINER_CLASS`) l'empeche de se
              compresser, donc de scroller au lieu de deborder. */}
                <div className="flex min-w-0 flex-1 flex-nowrap gap-1.5 overflow-x-auto">
                    <PillFilterGroup
                        groupLabel="Sol"
                        options={GROUND_TYPES}
                        selected={groundTypes}
                        onChange={setGroundTypes}
                    />
                    <PillFilterGroup
                        groupLabel="Environnement"
                        options={EQUIPMENT_TYPES}
                        selected={equipmentTypes}
                        onChange={setEquipmentTypes}
                    />
                    <AccessFilter value={freeAccess} onChange={setFreeAccess} />
                </div>
                {/* Hors de la zone `overflow-x-auto` ci-dessus (ticket 35) : toujours
              visible, jamais caché par le scroll horizontal mobile. Absent
              (pas juste desactive) quand aucun filtre n'est actif, meme
              pattern que la croix d'effacement de la recherche (`hasQuery`,
              BoulodromeSearch.tsx). */}
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={resetFilters}
                        aria-label="Réinitialiser les filtres"
                        className={`h-8 shrink-0 cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 text-xs font-medium whitespace-nowrap text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 ${FOCUS_RING_CLASS}`}
                    >
                        Réinitialiser
                    </button>
                )}
            </div>
        </>
    )
}

export default App
