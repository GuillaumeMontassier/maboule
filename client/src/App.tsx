import { useEffect, useState } from 'react'
import { fetchBoulodromes, type BoulodromesFeatureCollection } from './api/boulodromes'
import { BoulodromesMap } from './components/BoulodromesMap'
import { GroundTypeFilter } from './components/GroundTypeFilter'
import './App.css'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: BoulodromesFeatureCollection }

function App() {
  const [groundTypes, setGroundTypes] = useState<string[]>([])
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    setState({ status: 'loading' })
    fetchBoulodromes({ groundTypes })
      .then((data) => setState({ status: 'success', data }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        setState({ status: 'error', message })
      })
  }, [groundTypes])

  return (
    <>
      <GroundTypeFilter selected={groundTypes} onChange={setGroundTypes} />
      {state.status === 'loading' && <p className="status">Chargement des boulodromes…</p>}
      {state.status === 'error' && <p className="status status-error">{state.message}</p>}
      {state.status === 'success' && <BoulodromesMap features={state.data} />}
    </>
  )
}

export default App
