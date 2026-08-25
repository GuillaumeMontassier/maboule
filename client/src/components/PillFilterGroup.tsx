import { FOCUS_RING_INSET_CLASS } from './focusStyles'
import {
    PILL_ACTIVE_CLASS,
    PILL_GROUP_CONTAINER_CLASS,
    PILL_GROUP_LABEL_CLASS,
    PILL_INACTIVE_CLASS,
    PILL_SEGMENT_BASE_CLASS,
} from './pillStyles'

interface PillFilterGroupProps {
    groupLabel: string
    options: readonly string[]
    selected: string[]
    onChange: (selected: string[]) => void
}

// Pilule segmentee (ticket 31) : un segment libellé non-cliquable a gauche,
// les options a droite, dans un seul contour continu. `overflow-hidden
// rounded-full` sur le conteneur plutot que de calculer quel segment merite
// un coin arrondi : plus simple, et generalise si un groupe gagne plus de 2
// options. `FOCUS_RING_INSET_CLASS` (pas `FOCUS_RING_CLASS`) sur les
// boutons : un anneau a offset positif serait rogne par ce meme
// `overflow-hidden`, meme probleme que sur les listes scrollables (ticket
// 28). Pas de `role="group"` sur le conteneur (ticket 20) : un groupe ARIA
// sur un élément `display: contents` peut voir ses attributs ignorés par
// certaines combinaisons navigateur/lecteur d'écran - le contexte du groupe
// reste porté par l'`aria-label` de chaque pilule plutôt que par un rôle
// englobant.
export function PillFilterGroup({ groupLabel, options, selected, onChange }: PillFilterGroupProps) {
    function toggle(value: string) {
        onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
    }

    return (
        <div className={PILL_GROUP_CONTAINER_CLASS}>
            <span className={PILL_GROUP_LABEL_CLASS}>{groupLabel}</span>
            {options.map((value) => {
                const active = selected.includes(value)
                return (
                    <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        aria-label={`${groupLabel} : ${value}`}
                        onClick={() => toggle(value)}
                        className={`${PILL_SEGMENT_BASE_CLASS} ${active ? PILL_ACTIVE_CLASS : PILL_INACTIVE_CLASS} ${FOCUS_RING_INSET_CLASS}`}
                    >
                        {value}
                    </button>
                )
            })}
        </div>
    )
}
