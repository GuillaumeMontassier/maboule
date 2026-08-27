// Fond + texte opaques partages par toute surface flottante (widget de
// recherche, panneaux, bouton de theme) - meme raisonnement que dans
// BoulodromeSearch (ticket 18) mais extrait ici pour etre reutilisable hors
// de ce composant. Separe de `FLOATING_SURFACE_CLASS` ci-dessous : certains
// usages (ex. le champ de recherche) n'ont besoin que du fond opaque, pas de
// la bordure/du rayon/de l'ombre d'un panneau complet.
export const FLOATING_SURFACE_COLOR_CLASS = 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100'

// Chrome complet d'un panneau flottant (fond, bordure, rayon, ombre - light
// et dark), partage par `RoutePanel`, `ThemeToggle` et les cards de
// `BoulodromeSearch` (ticket 30 : ces trois composants reimplementaient
// independamment la meme intention visuelle). Le padding differe
// legitimement selon l'usage et reste donc un modificateur par composant,
// pas integre a ce token.
export const FLOATING_SURFACE_CLASS = `rounded-lg border border-gray-300 shadow-sm dark:border-gray-600 ${FLOATING_SURFACE_COLOR_CLASS}`

// Couleur de texte "erreur" sur une surface flottante (App.tsx, ticket 37) -
// meme couleur que la carte d'erreur de BoulodromeSearch (`STATUS_CARD_CLASS`,
// composant-local car sa carte porte aussi un positionnement `mt-1.5` propre
// a son propre usage, non reutilisable tel quel) et que RoutePanel (pas migre
// ici, hors scope de ce ticket) - extrait pour qu'un futur troisieme usage
// n'ait pas a redupliquer ce litteral une fois de plus.
export const STATUS_ERROR_TEXT_CLASS = 'text-red-700 dark:text-red-400'

// Chrome pilule partagé par les badges de contenu (accès libre/payant sur la
// Fiche boulodrome, distance sur la popup café) - déplacé de
// BoulodromesMap.tsx (où il s'appelait `POPUP_BADGE_CLASS`) vers ce fichier
// de tokens partagés au moment où la Fiche boulodrome (nouveau composant, cf.
// CONTEXT.md) en a eu besoin en plus de la popup café - seule la couleur
// varie entre usages.
export const PILL_BADGE_CLASS = 'mt-1 inline-block rounded-full px-2 py-0.5 text-[0.85em] font-semibold'
