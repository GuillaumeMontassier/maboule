// Padding/texte des segments d'une pilule-groupe (ticket 31), sans
// `rounded-full` - c'est le conteneur qui porte l'arrondi (`overflow-hidden
// rounded-full`) plutot que chaque segment individuellement. `py-2`/hauteur
// fixe `h-8` sur le conteneur (ticket 33) pour approcher au pixel pres la
// hauteur du champ de recherche (34px, bordure comprise) : les segments
// n'ont pas de bordure, l'ecart residuel de 2px est juge negligeable a
// l'oeil plutot que corrige par une valeur arbitraire non documentee.
export const PILL_SEGMENT_BASE_CLASS = 'px-3 py-2 text-xs font-medium transition-colors'

export const PILL_ACTIVE_CLASS = 'bg-blue-600 text-white dark:bg-blue-500'
export const PILL_INACTIVE_CLASS =
    'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'

// Segment libellé non-cliquable d'une pilule-groupe (ticket 31) : nuance
// distincte des pilules actives (bleu) et inactives (gris clair) mais dans
// la meme famille neutre, pas une couleur differente - un cran plus soutenu
// que PILL_INACTIVE_CLASS.
export const PILL_GROUP_LABEL_CLASS = 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
