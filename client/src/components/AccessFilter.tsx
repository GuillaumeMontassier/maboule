import { FOCUS_RING_INSET_CLASS } from './focusStyles'
import { PILL_ACTIVE_CLASS, PILL_GROUP_LABEL_CLASS, PILL_INACTIVE_CLASS, PILL_SEGMENT_BASE_CLASS } from './pillStyles'

interface AccessFilterProps {
    value: boolean | undefined
    onChange: (value: boolean | undefined) => void
}

interface AccessSegment {
    label: string
    segmentValue: boolean
}

const SEGMENTS: AccessSegment[] = [
    { label: 'Libre', segmentValue: true },
    { label: 'Restreint', segmentValue: false }
]

// Pilule-groupe a 2 segments mutuellement exclusifs (ticket 32, reactive le
// 3e etat de ticket 20 disparu avec le toggle simple de FreeAccessFilter) :
// "Libre" (freeAccess=true) et "Restreint" (freeAccess=false) ne peuvent pas
// etre actifs en meme temps - un boulodrome est soit l'un, soit l'autre,
// jamais les deux. Recliquer le segment actif revient a `undefined` (pas de
// filtre = tous). Meme traitement visuel que PillFilterGroup (ticket 31,
// libelle non-cliquable + segments dans un seul contour), mais logique
// d'exclusion mutuelle propre a ce composant : PillFilterGroup gere une
// selection multiple independante (`selected: string[]`), inadaptee a un
// choix binaire exclusif sur `boolean | undefined`.
export function AccessFilter({ value, onChange }: AccessFilterProps) {
    return (
        <div className="inline-flex h-8 shrink-0 overflow-hidden rounded-full">
            <span className={`${PILL_SEGMENT_BASE_CLASS} ${PILL_GROUP_LABEL_CLASS}`}>Accès</span>
            {SEGMENTS.map(({ label, segmentValue }) => {
                const active = value === segmentValue
                return (
                    <button
                        key={label}
                        type="button"
                        aria-pressed={active}
                        aria-label={`Accès : ${label}`}
                        onClick={() => onChange(active ? undefined : segmentValue)}
                        className={`${PILL_SEGMENT_BASE_CLASS} ${active ? PILL_ACTIVE_CLASS : PILL_INACTIVE_CLASS} ${FOCUS_RING_INSET_CLASS}`}
                    >
                        {label}
                    </button>
                )
            })}
        </div>
    )
}
