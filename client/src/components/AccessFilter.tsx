import { FOCUS_RING_INSET_CLASS } from './focusStyles'
import {
    PILL_ACTIVE_CLASS,
    PILL_GROUP_CONTAINER_CLASS,
    PILL_GROUP_LABEL_CLASS,
    PILL_INACTIVE_CLASS,
    PILL_SEGMENT_BASE_CLASS
} from './pillStyles'

interface AccessFilterProps {
    value: boolean | undefined
    onChange: (value: boolean | undefined) => void
}

// Remplace le toggle simple à 2 états de ticket 20 (ticket 32) : le backend
// gère déjà les 3 états (`freeAccess: true | false | undefined`), seule
// l'option "accès restreint uniquement" avait disparu de l'UI. 2 segments
// mutuellement exclusifs plutôt qu'un bouton cyclique à 3 états (états
// cachés, coût de désélection à 2 clics, accessibilité - écarté en session)
// : un boulodrome est soit libre, soit restreint, jamais les deux, donc
// l'exclusion entre 2 segments visibles couvre les 3 états (aucun actif =
// tous, l'un ou l'autre actif = filtré). Même gabarit visuel que
// `PillFilterGroup` (ticket 31), mais composant dédié plutôt qu'une
// réutilisation directe : sa sélection multi-indépendante par option ne
// convient pas à une exclusion mutuelle entre 2 segments.
export function AccessFilter({ value, onChange }: AccessFilterProps) {
    return (
        <div className={PILL_GROUP_CONTAINER_CLASS}>
            <span className={PILL_GROUP_LABEL_CLASS}>Accès</span>
            <button
                type="button"
                aria-pressed={value === true}
                aria-label="Accès : Libre"
                onClick={() => onChange(value === true ? undefined : true)}
                className={`${PILL_SEGMENT_BASE_CLASS} ${value === true ? PILL_ACTIVE_CLASS : PILL_INACTIVE_CLASS} ${FOCUS_RING_INSET_CLASS}`}
            >
                Libre
            </button>
            <button
                type="button"
                aria-pressed={value === false}
                aria-label="Accès : Restreint"
                onClick={() => onChange(value === false ? undefined : false)}
                className={`${PILL_SEGMENT_BASE_CLASS} ${value === false ? PILL_ACTIVE_CLASS : PILL_INACTIVE_CLASS} ${FOCUS_RING_INSET_CLASS}`}
            >
                Restreint
            </button>
        </div>
    )
}
