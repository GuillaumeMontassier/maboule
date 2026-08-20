export const PILL_BASE_CLASS = 'rounded-full px-3 py-1 text-xs font-medium transition-colors'

// Meme padding/texte que PILL_BASE_CLASS mais sans `rounded-full` - pour les
// segments d'une pilule-groupe (ticket 31), ou c'est le conteneur qui porte
// l'arrondi (`overflow-hidden rounded-full`) plutot que chaque segment
// individuellement. Constante separee plutot qu'un `rounded-none` ajoute a
// la suite de PILL_BASE_CLASS : Tailwind ordonne ses classes de rayon par
// echelle (rounded-none avant rounded-full) dans la feuille generee, pas par
// ordre d'apparition dans `className` - un simple ajout en fin de chaine ne
// gagnerait donc pas la cascade contre le `rounded-full` deja present.
export const PILL_SEGMENT_BASE_CLASS = 'px-3 py-2 text-xs font-medium transition-colors'

export const PILL_ACTIVE_CLASS = 'bg-blue-600 text-white dark:bg-blue-500'
export const PILL_INACTIVE_CLASS =
    'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'

// Segment libellé non-cliquable d'une pilule-groupe (ticket 31) : nuance
// distincte des pilules actives (bleu) et inactives (gris clair) mais dans
// la meme famille neutre, pas une couleur differente - un cran plus soutenu
// que PILL_INACTIVE_CLASS.
export const PILL_GROUP_LABEL_CLASS = 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
