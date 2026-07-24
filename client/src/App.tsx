import { useEffect, useState } from 'react'
import { fetchBoulodromes, type BoulodromesFeatureCollection } from './api/boulodromes'
import { BoulodromesMap } from './components/BoulodromesMap'
import './App.css'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: BoulodromesFeatureCollection }

function App() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    fetchBoulodromes()
      .then((data) => setState({ status: 'success', data }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        setState({ status: 'error', message })
      })
  }, [])

  if (state.status === 'loading') {
    return <p className="status">Chargement des boulodromes…</p>
  }

  if (state.status === 'error') {
    return <p className="status status-error">{state.message}</p>
  }

  return <BoulodromesMap features={state.data} />
}

export default App
