# Carte des boulodromes de Paris

Carte interactive des infrastructures de pétanque à Paris (boulodromes, cafés
à proximité, itinéraires à pied), basée sur l'open data de la Ville de Paris
et d'OpenStreetMap.

## Language

**Boulodrome**:
Un terrain de pétanque à Paris, avec son type d'équipement, la nature du sol
et son accès libre/payant — source : open data Ville de Paris / Data ES.

**Fiche boulodrome**:
Le panneau déporté (hors de la carte) affichant les infos détaillées du
boulodrome sélectionné — desktop : colonne gauche sous la recherche et les
filtres ; mobile : bas d'écran, au-dessus du panneau Itinéraire. Remplace
l'ancienne popup Leaflet ouverte au-dessus du pin, qui masquait les cafés à
proximité.
_Avoid_: popup, card, panneau détail

**Café**:
Un café, bar ou pub à proximité d'un boulodrome, importé depuis
OpenStreetMap (licence ODbL).

**Itinéraire**:
Un trajet à pied entre un point de départ et un boulodrome, calculé par un
fournisseur de routage externe (OpenRouteService) et affiché comme un tracé
sur la carte.
_Avoid_: trajet, parcours, directions

**Point de départ**:
L'origine d'un itinéraire, renseignée par l'utilisateur soit via sa position
GPS, soit par recherche d'adresse — jamais par clic sur la carte.
_Avoid_: point A, origine
