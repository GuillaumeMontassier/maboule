import { FOCUS_RING_CLASS } from './focusStyles'
import { PILL_ACTIVE_CLASS, PILL_BASE_CLASS, PILL_INACTIVE_CLASS } from './pillStyles'

interface FreeAccessFilterProps {
    value: boolean | undefined
    onChange: (value: boolean | undefined) => void
}

// Le `<select>` à 3 états (Tous / Accès libre / Accès payant-restreint)
// devient une seule pilule toggle (ticket 20, décision de triage) : l'option
// "accès payant/restreint uniquement" disparaît de l'UI. Actif = filtre
// `freeAccess: true`, inactif = pas de filtre (`freeAccess: undefined`).
export function FreeAccessFilter({ value, onChange }: FreeAccessFilterProps) {
    const active = value === true

    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? undefined : true)}
            className={`${PILL_BASE_CLASS} ${active ? PILL_ACTIVE_CLASS : PILL_INACTIVE_CLASS} ${FOCUS_RING_CLASS}`}
        >
            Accès libre
        </button>
    )
}
