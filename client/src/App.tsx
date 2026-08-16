import { useEffect, useState } from 'react'
import { fetchBoulodromes, type BoulodromesFeatureCollection } from './api/boulodromes'
import { BoulodromesMap } from './components/BoulodromesMap'
import { PillFilterGroup } from './components/PillFilterGroup'
import { FreeAccessFilter } from './components/FreeAccessFilter'
import { ThemeToggle } from './components/ThemeToggle'
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
          avant elle (ticket 15). Position CSS `fixed` : cet ordre n'a aucun
          effet visuel, seulement sur l'ordre de tabulation et l'ordre de
          peinture (sans incidence ici, aucun chevauchement entre panneaux à
          l'état par défaut, cf. ticket 09/12). */}
      <div className="fixed top-14 left-1/2 z-[1000] flex w-[280px] -translate-x-1/2 flex-row flex-wrap gap-1.5 text-sm md:top-3 md:left-[300px] md:w-auto md:translate-x-0">
        <PillFilterGroup
          groupLabel="Nature du sol"
          options={GROUND_TYPES}
          selected={groundTypes}
          onChange={setGroundTypes}
        />
        <PillFilterGroup
          groupLabel="Type d'équipement"
          options={EQUIPMENT_TYPES}
          selected={equipmentTypes}
          onChange={setEquipmentTypes}
        />
        <FreeAccessFilter value={freeAccess} onChange={setFreeAccess} />
      </div>
    </>
  )
}

export default App
