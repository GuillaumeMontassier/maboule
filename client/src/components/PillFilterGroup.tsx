import { PILL_ACTIVE_CLASS, PILL_BASE_CLASS, PILL_INACTIVE_CLASS } from './pillStyles'

interface PillFilterGroupProps {
    groupLabel: string
    options: readonly string[]
    selected: string[]
    onChange: (selected: string[]) => void
}

// Pas de fieldset/légende/encart autour du groupe (ticket 20) : les pilules
// de tous les groupes se retrouvent à plat dans la même rangée qui wrap chez
// le parent (App.tsx). Le contexte du groupe (ex. "Nature du sol") est porté
// directement par l'`aria-label` de chaque pilule plutôt que par un `role="group"`
// englobant : un groupe ARIA sur un élément `display: contents` peut voir ses
// attributs ARIA ignorés par certaines combinaisons navigateur/lecteur
// d'écran, ce qu'un `aria-label` sur le bouton lui-même n'expose pas ce
// risque.
export function PillFilterGroup({ groupLabel, options, selected, onChange }: PillFilterGroupProps) {
    function toggle(value: string) {
        onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
    }

    return (
        <>
            {options.map((value) => {
                const active = selected.includes(value)
                return (
                    <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        aria-label={`${groupLabel} : ${value}`}
                        onClick={() => toggle(value)}
                        className={`${PILL_BASE_CLASS} ${active ? PILL_ACTIVE_CLASS : PILL_INACTIVE_CLASS}`}
                    >
                        {value}
                    </button>
                )
            })}
        </>
    )
}
