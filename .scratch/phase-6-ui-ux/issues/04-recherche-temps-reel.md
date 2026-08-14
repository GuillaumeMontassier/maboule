# 04 — Barre de recherche : recherche en temps réel + sélection clavier

**What to build:** La recherche de boulodrome se déclenche automatiquement pendant la frappe (au lieu d'attendre la soumission du formulaire), et la touche Entrée sélectionne directement le premier résultat affiché.

**Blocked by:** 01 — Mise en place de Tailwind CSS

**Status:** ready-for-agent

- [ ] Taper dans le champ de recherche déclenche une requête après un court délai d'inactivité (debounce ~300ms), pas une requête par caractère
- [ ] Aucune requête n'est déclenchée en dessous de 2 caractères saisis
- [ ] Une réponse qui arrive après qu'une saisie plus récente a été faite est ignorée (pas d'affichage de résultats obsolètes) — même principe que la protection déjà en place sur la version "soumission"
- [ ] Appuyer sur Entrée alors que des résultats sont affichés sélectionne directement le premier résultat de la liste
- [ ] Tests couvrant : déclenchement au fil de la frappe avec debounce, absence de requête sous le seuil de caractères, ignorance d'une réponse tardive obsolète, sélection du premier résultat par Entrée
