# Utiliser OpenRouteService plutôt qu'un OSRM auto-hébergé pour l'itinéraire

La Phase 5 nécessite une API de routage piéton entre un point de départ et
un boulodrome. Auto-héberger OSRM impliquerait un nouveau service Railway,
un extrait OSM pré-traité pour la région parisienne et un profil de routage
à maintenir — un chantier d'infra disproportionné pour une app à faible
trafic. Décision : utiliser OpenRouteService (API hébergée, offre gratuite :
2000 req/jour, 40 req/min) à la fois pour le routage et le géocodage
(adresse → coordonnées), via un proxy côté backend qui garde la clé API hors
du client. À revisiter si le trafic augmente significativement, ou si
l'auto-hébergement OSRM devient lui-même un objectif d'apprentissage du
projet.
