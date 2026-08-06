import { useEffect, useState } from 'react'
import { fetchBoulodromes, type BoulodromesFeatureCollection } from './api/boulodromes'
import { BoulodromesMap } from './components/BoulodromesMap'
import { CheckboxFilter } from './components/CheckboxFilter'
import { FreeAccessFilter } from './components/FreeAccessFilter'
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
      <div className="filters-bar">
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
