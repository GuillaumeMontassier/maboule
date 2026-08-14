# 05 — Barre de recherche : historique de recherche

**What to build:** Au focus du champ de recherche, avant toute saisie, l'utilisateur voit la liste des derniers boulodromes qu'il a sélectionnés. Cliquer un élément de cette liste sélectionne directement ce boulodrome.

**Blocked by:** 01 — Mise en place de Tailwind CSS

**Status:** ready-for-agent

- [ ] Mettre le focus sur le champ de recherche quand il est vide affiche l'historique des boulodromes récemment sélectionnés (nom du boulodrome, pas juste le texte tapé)
- [ ] L'historique est limité à 5 entrées, sans doublon (sélectionner un boulodrome déjà présent le remonte en tête plutôt que de le dupliquer)
- [ ] L'historique persiste entre les rechargements de page (`localStorage`)
- [ ] Cliquer une entrée de l'historique sélectionne directement le boulodrome correspondant, sans étape de confirmation supplémentaire
- [ ] Sélectionner un boulodrome par n'importe quel moyen (marqueur, recherche, historique) alimente l'historique
- [ ] Tests couvrant : affichage au focus sur champ vide, limite de 5 + dédoublonnage, sélection directe au clic
