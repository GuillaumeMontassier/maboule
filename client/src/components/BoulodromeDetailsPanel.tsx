import { X } from 'lucide-react'
import type { BoulodromeProperties } from '../api/boulodromes'
import { distinctSiteName } from '../lib/site-name'
import { FOCUS_RING_CLASS } from './focusStyles'
import { FLOATING_SURFACE_CLASS, PILL_BADGE_CLASS } from './surfaceStyles'

interface BoulodromeDetailsPanelProps {
    properties: BoulodromeProperties
    onClose: () => void
}

// Fiche boulodrome (CONTEXT.md) : remplace la popup Leaflet ouverte au-dessus
// du pin sélectionné, qui masquait les cafés/bars à proximité affichés en
// même temps (cf. spec `.scratch/fiche-boulodrome/spec.md`). Même contenu que
// l'ancienne popup, sans ajout.
//
// Desktop : colonne gauche, sous la recherche et les filtres (`top-[102px]`,
// hauteur mesurée de ce bloc + marge, même principe que
// `MOBILE_SEARCH_FILTERS_HEIGHT_PX`). Mobile : bas d'écran, empilée au-dessus
// du `RoutePanel` (`bottom-[349px]` = marge + hauteur max de RoutePanel +
// marge, cf. `ROUTE_PANEL_LAYOUT`). Valeurs littérales requises par le
// scanner JIT de Tailwind (pas d'interpolation) - le ticket 03
// (`.scratch/fiche-boulodrome/issues/03-*.md`) les reprend dans une constante
// de layout partagée, à garder synchronisée avec ces classes le cas échéant.
export function BoulodromeDetailsPanel({ properties, onClose }: BoulodromeDetailsPanelProps) {
    const siteName = distinctSiteName(properties.name, properties.siteName)

    return (
        <div
            role="region"
            aria-label="Détails du boulodrome sélectionné"
            className={`fixed inset-x-3 bottom-[349px] z-[1000] px-3 py-2.5 font-sans text-sm md:inset-x-auto md:bottom-auto md:left-3 md:top-[102px] md:w-[280px] ${FLOATING_SURFACE_CLASS}`}
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Fermer la fiche"
                className={`float-right cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ${FOCUS_RING_CLASS}`}
            >
                <X size={16} />
            </button>
            <strong>{properties.name}</strong>
            {siteName && (
                <>
                    <br />
                    {siteName}
                </>
            )}
            <br />
            {properties.street}, {properties.postalCode} {properties.city}
            {(properties.equipmentType || properties.groundType) && (
                <>
                    <br />
                    {[properties.equipmentType, properties.groundType].filter(Boolean).join(' · ')}
                </>
            )}
            {properties.freeAccess !== null && (
                <>
                    <br />
                    <span
                        className={`${PILL_BADGE_CLASS} ${
                            properties.freeAccess
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                        }`}
                    >
                        {properties.freeAccess ? 'Accès libre' : 'Accès payant / restreint'}
                    </span>
                </>
            )}
        </div>
    )
}
