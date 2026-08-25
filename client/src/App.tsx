import { useEffect, useState } from 'react'
import { fetchBoulodromes, type BoulodromesFeatureCollection } from './api/boulodromes'
import { BoulodromesMap } from './components/BoulodromesMap'
import { PillFilterGroup } from './components/PillFilterGroup'
import { AccessFilter } from './components/AccessFilter'
import { ThemeToggle } from './components/ThemeToggle'
import { FOCUS_RING_CLASS } from './components/focusStyles'
import { EQUIPMENT_TYPES, GROUND_TYPES } from './constants/boulodromeFilters'
import './App.css'

type State =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'success'; data: BoulodromesFeatureCollection }

function App() {
    const [groundTypes, setGroundTypes] = useState<string[]>([])
    const [equipmentTypes, setEquipmentTypes] = useState<string[]>([])
    const [freeAccess, setFreeAccess] = useState<boolean | undefined>(undefined)
    const [state, setState] = useState<State>({ status: 'loading' })

    useEffect(() => {
        setState({ status: 'loading' })
        fetchBoulodromes({ groundTypes, equipmentTypes, freeAccess })
            .then((data) => setState({ status: 'success', data }))
            .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : 'Erreur inconnue'
                setState({ status: 'error', message })
            })
    }, [groundTypes, equipmentTypes, freeAccess])

    const hasActiveFilters = groundTypes.length > 0 || equipmentTypes.length > 0 || freeAccess !== undefined

    function resetFilters() {
        setGroundTypes([])
        setEquipmentTypes([])
        setFreeAccess(undefined)
    }

    return (
        <>
            {/* Rendu ici plutot que dans BoulodromesMap : independant du chargement
          des boulodromes (n'a besoin d'aucune donnee de l'API), il doit rester
          monte et utilisable pendant le chargement/erreur, et ne pas se
          demonter/remonter a chaque refetch declenche par un changement de
          filtre (BoulodromesMap est demonte/remonte entre chaque etat
          loading/success). */}
            <ThemeToggle />
            {state.status === 'loading' && <p className="status">Chargement des boulodromes…</p>}
            {state.status === 'error' && <p className="status status-error">{state.message}</p>}
            {state.status === 'success' && <BoulodromesMap features={state.data} />}
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
