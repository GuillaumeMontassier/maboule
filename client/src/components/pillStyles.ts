// Segment individuel d'une pilule-groupe (ticket 31) : chaque option est une
// pilule arrondie a part entiere (`rounded-full`), separee des autres par le
// `gap-1` du conteneur, plutot qu'une seule barre continue decoupee en
// tranches - `h-6`/`my-auto` la centrent verticalement dans le conteneur
// (`h-8`) sans etirer son padding. `whitespace-nowrap` : un segment ne doit
// jamais laisser son texte retomber sur deux lignes quand le conteneur
// parent le compresse (flex-wrap mobile, App.tsx) - une hauteur fixe (`h-6`)
// combinee a du texte sur deux lignes casserait la forme de la pilule.
export const PILL_SEGMENT_BASE_CLASS = 'h-6 my-auto px-3 text-xs font-medium whitespace-nowrap transition-colors rounded-full'

export const PILL_ACTIVE_CLASS = 'bg-blue-600 text-white dark:bg-blue-500'
export const PILL_INACTIVE_CLASS =
    'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'

// Contour englobant d'une pilule-groupe (ticket 31) : fond, bordure et
// arrondi du conteneur qui porte le libellé + les segments. `shrink-0` : un
// enfant de conteneur flex-wrap (App.tsx) se compresse par defaut avant de
// passer a la ligne suivante - ce groupe doit au contraire garder sa largeur
// naturelle et retomber en entier sur une nouvelle ligne plutot que de
// compresser ses segments (meme raison que `whitespace-nowrap` ci-dessus).
export const PILL_GROUP_CONTAINER_CLASS =
    'inline-flex h-8 shrink-0 items-center gap-1 overflow-hidden rounded-full border border-gray-300 bg-white pl-2.5 pr-1 dark:border-gray-600 dark:bg-gray-800'

// Libellé non-cliquable d'une pilule-groupe (ticket 31) : meme gabarit de
// texte (`text-xs font-medium`) que les segments (PILL_SEGMENT_BASE_CLASS)
// pour rester aligne visuellement avec eux, plutot que d'heriter du
// `text-sm` du conteneur de filtres (App.tsx).
export const PILL_GROUP_LABEL_CLASS = 'text-xs font-medium whitespace-nowrap text-gray-700 dark:text-gray-300'
