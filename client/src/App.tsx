import { useEffect, useState } from 'react'
import { fetchBoulodromes, type BoulodromesFeatureCollection } from './api/boulodromes'
import { BoulodromesMap } from './components/BoulodromesMap'
import { CheckboxFilter } from './components/CheckboxFilter'
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
      <div className="fixed top-14 left-1/2 z-[1000] flex w-[280px] -translate-x-1/2 flex-col gap-2 text-sm md:top-3 md:left-[300px] md:w-auto md:translate-x-0">
        <CheckboxFilter
          legend="Nature du sol"
          options={GROUND_TYPES}
          selected={groundTypes}
          onChange={setGroundTypes}
        />
        <CheckboxFilter
          legend="Type d'équipement"
          options={EQUIPMENT_TYPES}
          selected={equipmentTypes}
          onChange={setEquipmentTypes}
        />
        <FreeAccessFilter value={freeAccess} onChange={setFreeAccess} />
      </div>
      {state.status === 'loading' && <p className="status">Chargement des boulodromes…</p>}
      {state.status === 'error' && <p className="status status-error">{state.message}</p>}
      {state.status === 'success' && <BoulodromesMap features={state.data} />}
    </>
  )
}

export default App
