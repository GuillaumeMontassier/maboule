// Valeurs observees dans le dataset Data ES pour les boulodromes parisiens -
// pas d'endpoint dedie pour les lister dynamiquement, cf. le meme choix pour
// famille="Boulodrome" dans l'ingestion.
export const GROUND_TYPES = ["Stabilisé/cendrée", "Sable"] as const;
export const EQUIPMENT_TYPES = ["Découvert", "Extérieur couvert"] as const;
