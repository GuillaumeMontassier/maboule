# Phase 6 — Refonte UI/UX (interface professionnelle)

Décisions issues d'une session `/grill-with-docs` (2026-08-14). Sert de base
à un futur découpage en tickets (`/to-tickets`).

## Décisions reportées à une future session

- **Bouton "Itinéraire" dans la card du lieu** — sémantique exacte pas
  tranchée (le `RoutePanel` est déjà affiché automatiquement dès qu'un
  boulodrome est sélectionné, donc "activer le mode itinéraire" tel qu'écrit
  dans `ROADMAP.md` ne correspond à aucun état existant — probablement un
  simple scroll + focus sur le champ adresse, à confirmer).
- **Fond de carte en dark mode** — pas de variante sombre pour le
  fournisseur de tuiles actuel (`tile.openstreetmap.org`) ; deux options en
  jeu : changer de fournisseur (ex. CARTO Positron/Dark Matter, gratuit,
  réglerait aussi une non-conformité latente avec la politique d'usage des
  tuiles OSM) ou filtre CSS sur les tuiles actuelles.

## Fondation

- **CSS** : migration vers Tailwind CSS, base commune pour le responsive, le
  dark mode et la refonte visuelle — voir
  [docs/adr/0002-tailwind-for-phase-6-refonte.md](../../docs/adr/0002-tailwind-for-phase-6-refonte.md)
- **Breakpoint mobile/desktop** : 768px

## Barre de recherche

- Centrée en mobile (< 768px), alignée à gauche en desktop (≥ 768px)
- Historique de recherche au focus : boulodromes sélectionnés (nom + id, pas
  le texte tapé), `localStorage`, 5 entrées max, dédupliquées ; clic sur un
  item = sélection directe du boulodrome (même chemin qu'un résultat de
  recherche), pas de pré-remplissage à valider une deuxième fois
- Résultats en temps réel avec debounce 300ms, déclenché à partir de 2
  caractères
- Entrée sélectionne le premier résultat de la liste (pas de navigation au
  clavier par flèches pour cette phase — à ajouter plus tard si le besoin se
  confirme à l'usage)

## Sélection d'un lieu

- Recentrage automatique : `flyTo` (animation fluide) ; conserve le zoom
  courant s'il est ≥ 15, sinon monte à 16
- Bouton "Itinéraire" : reporté, voir ci-dessus

## Filtres

- Desktop : à droite de la barre de recherche, même ligne
- Mobile : sous la barre de recherche, même largeur qu'elle (pas pleine
  largeur d'écran)

## Contrôles de carte

- Boutons zoom déplacés en bas à droite, marge 12px (cohérent avec le reste
  de l'UI) — aucune collision avec un autre élément à cet endroit
  aujourd'hui (le `RoutePanel` est en bas à gauche)

## Icônes

- Un point avec contour blanc commun, couleur variant selon le type :
  piéton `blue-500`, café `amber-600`, bar `purple-500`, pub `orange-600`
  (tokens Tailwind, ajustables plus tard)
- Le contour reste blanc en dark mode (meilleur contraste sur fond de carte
  sombre qu'un contour adapté au thème)

## Mise en page générale

Audit des chevauchements entre panneaux (recherche, filtres, popups,
contrôles de zoom) sur toutes les tailles d'écran — vérification à faire une
fois les repositionnements ci-dessus implémentés, pas une décision de design
séparée.

## Dark mode

- Bascule manuelle + persistée (`localStorage`), valeur initiale basée sur
  `prefers-color-scheme`
- Bouton de bascule placé près des contrôles de zoom, bas à droite
- Fond de carte : reporté, voir ci-dessus
- Contraste icônes/popups : suit les tokens Tailwind `dark:` mis en place
  par la migration CSS ; contour d'icône traité séparément ci-dessus

## Tests

Tests unitaires/composants sur le nouveau comportement de recherche
(debounce, sélection au clavier, historique) — cf. note transverse Tests de
`ROADMAP.md` : accompagnent chaque fonctionnalité au fil de l'eau.
