// Anneau de focus clavier partagé par tous les contrôles interactifs de
// l'app (ticket 28), même principe que `pillStyles.ts` : un seul token
// plutôt qu'un style par composant, pour garantir un traitement cohérent.
// `outline` (pas `ring`/`box-shadow`) : dessiné hors de la boîte de
// l'élément, il n'a donc pas besoin d'une couleur "offset" assortie au fond
// de chaque composant (blanc, gris, pilule active bleue...), contrairement
// à un ring Tailwind classique. `focus-visible:` (pas `focus:`) : n'affiche
// l'anneau qu'à la navigation clavier, pas au clic souris, pour rester
// distinct du style hover.
export const FOCUS_RING_CLASS =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:focus-visible:outline-blue-400'

// Variante pour les items de liste dans un conteneur `overflow-y-auto`
// (résultats de recherche, historique, candidats d'adresse) : ces boutons
// touchent les bords du conteneur scrollable, qui rogne tout ce qui dépasse
// sa propre boîte - un outline à offset positif s'y retrouve donc coupé sur
// 3 côtés (vérifié visuellement, ticket 28). Offset négatif : l'anneau reste
// entièrement dans la boîte du bouton, jamais rogné, quel que soit le
// conteneur.
export const FOCUS_RING_INSET_CLASS =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600 dark:focus-visible:outline-blue-400'
