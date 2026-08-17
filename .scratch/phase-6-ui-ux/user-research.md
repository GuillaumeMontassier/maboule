Status: needs-triage

# Recherche utilisateur — Phase 6 (refonte UI/UX)

## Pourquoi maintenant

Deux décisions de la Phase 6 sont explicitement en attente d'arbitrage
(`ROADMAP.md`, section Phase 6) :

1. La sémantique exacte du bouton "Itinéraire" dans la card d'un lieu
2. Le choix du fond de carte en dark mode

Par ailleurs, l'audit UI/UX récent (tickets 12 à 27,
`.scratch/phase-6-ui-ux/issues/`) a surtout été mené en revue interne
(clavier, a11y, chevauchements). Aucun de ces retours ne vient d'un
utilisateur réel qui découvre l'app sans connaître le code. Avant de
trancher les deux points ci-dessus — et avant de considérer la Phase 6
"terminée" — une session de test utilisateur légère permet de vérifier que
les parcours clés (chercher un boulodrome, comprendre les badges,
déclencher un itinéraire) sont compréhensibles pour quelqu'un d'extérieur.

## Portée

Recherche légère, adaptée à un projet solo sans base d'utilisateurs
existante : pas d'étude quanti, pas de panel recruté via un outil pro.
L'objectif est d'obtenir 5-6 retours qualitatifs sur l'app **telle qu'elle
existe aujourd'hui**, pas de valider des concepts qui n'existent pas encore
(pas de maquette Figma à montrer — l'app tourne en local, on teste dessus
directement).

## Méthode : test d'utilisabilité + entretien court (pas un entretien pur)

**Pourquoi ce choix plutôt qu'un entretien classique** : un entretien pur
("qu'est-ce que vous pensez de X ?") repose sur ce que les gens *disent*
faire, qui diverge souvent de ce qu'ils *font* réellement face à une
interface. Ici, l'app existe et tourne — on peut observer un usage réel en
"think-aloud" (l'utilisateur verbalise ce qu'il pense en agissant), ce qui
révèle les points de friction concrets (ex. : est-ce qu'on comprend que le
bouton "Itinéraire" change le mode de l'app, ou est-ce qu'on cherche un
itinéraire ailleurs ?). L'entretien classique reste utile en complément,
en amont (habitudes actuelles) et en aval (réaction à chaud), mais pas
comme méthode unique.

- **Échantillon** : 5-6 personnes. Suffisant pour repérer les problèmes
  d'utilisabilité récurrents (au-delà de 5, les nouveaux testeurs
  répètent en grande partie les mêmes blocages) — voir table du skill,
  ligne "Usability testing".
- **Profil recherché** : mix de deux profils, pas un seul —
  - 2-3 joueurs de pétanque réguliers (connaissent le vocabulaire terrain
    Découvert/Couvert, sol stabilisé, etc. — testent si l'app parle leur
    langue)
  - 2-3 habitants de Paris non-joueurs (testent si l'app reste
    compréhensible sans connaître le milieu — pédagogie du produit)
- **Recrutement** : réseau personnel + un club de pétanque parisien
  (ex. via une fédération locale ou un groupe Facebook/Discord de
  joueurs) pour le premier profil ; entourage pour le second. Pas de
  panel payant — hors budget/scope d'un projet portfolio.
- **Format** : 25-30 min, en personne ou visio avec partage d'écran,
  sur l'app en l'état (build local ou déployé). Un seul participant à la
  fois.
- **Ce qu'on ne teste pas** : recherche avancée, contributions
  utilisateurs (Phase 7, hors scope) — voir `CLAUDE.md`, section "Hors
  scope pour l'instant".

## Objectifs de recherche

1. Un utilisateur comprend-il, sans aide, comment trouver un boulodrome
   près de chez lui et lire ses caractéristiques (sol, couvert/découvert,
   libre/payant) ?
2. Le bouton "Itinéraire" est-il découvert et son effet est-il prévisible
   avant de cliquer ? (→ input direct pour la décision en attente)
3. Les marqueurs café/bar/pub sont-ils compris comme "à proximité d'un
   boulodrome" et pas comme une fonctionnalité indépendante ?
4. Où bloque-t-on dans le flux itinéraire (GPS vs adresse, choix parmi
   plusieurs candidats) ?
5. Attentes spontanées sur un mode sombre (utile pour trancher le fond de
   carte en dark mode) — question posée sans montrer de maquette, pour ne
   pas biaiser vers une réponse binaire.

## Déroulé de la session

### 1. Accueil (3 min)
Contexte : "C'est un projet perso, je veux voir si on comprend l'app sans
explication de ma part — il n'y a pas de bonne ou mauvaise réponse, et si
vous êtes bloqué·e c'est une info utile, pas un échec de votre part."
Demander l'autorisation d'enregistrer (audio suffit) si applicable.

### 2. Contexte actuel (5 min)
- "Comment tu t'y prends aujourd'hui pour trouver un terrain de pétanque
  à Paris ?" (si joueur)
- "Est-ce que tu utilises déjà des cartes/apps pour trouver des
  équipements sportifs ou des lieux publics ?" (les deux profils)
- Ne pas encore montrer l'app.

### 3. Tâches en think-aloud sur l'app (15 min)
Consigne avant de démarrer : "Dis à voix haute ce que tu cherches, ce que
tu comprends, ce sur quoi tu hésites — même si ça paraît évident."

- **Tâche A** — "Trouve un boulodrome couvert, en accès libre, pas trop
  loin d'ici." (teste recherche + filtres + lecture des badges)
- **Tâche B** — "Il y a un café à proximité de ce boulodrome ?" (teste
  compréhension des marqueurs café)
- **Tâche C** — "Tu veux t'y rendre à pied depuis [ici / une adresse
  donnée] — fais-le." (teste découverte + flux itinéraire GPS et adresse)
  - Observer : est-ce qu'iel trouve le bouton "Itinéraire" seul⋅e ?
    Sait-iel dire ce qu'il va se passer avant de cliquer ?

Ne pas aider sauf blocage total > 1 min — noter le point de blocage plutôt
que de l'expliquer.

### 4. Réactions à chaud (5 min)
- "Qu'est-ce qui était clair ? Qu'est-ce qui était confus ?"
- "Si l'app avait un mode sombre, tu t'attendrais à quoi pour le fond de
  carte — les rues sombres comme le reste, ou la carte qui garde ses
  couleurs habituelles ?" (question ouverte, ne pas montrer d'exemple)

### 5. Clôture (2 min)
- "Un truc qu'on n'a pas abordé et qui te semble important ?"
- Remercier.

## Synthèse (après les 5-6 sessions)

Utiliser un tableau simple par participant × tâche (réussi sans aide /
réussi avec hésitation / bloqué), puis grouper les verbatims par thème
(affinity mapping léger). Les points qui reviennent chez 3+ participants
sur 5-6 sont à traiter en priorité — sinon, consigner comme signal faible.

Sortie attendue :
- Réponse argumentée aux deux décisions en attente (bouton "Itinéraire",
  fond de carte dark mode), à reporter dans `ROADMAP.md`
- Nouveaux tickets si des blocages inédits apparaissent, sous
  `.scratch/phase-6-ui-ux/issues/`, à la suite du numéro 27
