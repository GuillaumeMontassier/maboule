// Valeurs observees dans le dataset Data ES pour les boulodromes parisiens
// (`aire_nature_sol`) - pas d'endpoint dedie pour les lister dynamiquement,
// cf. le meme choix pour famille="Boulodrome" dans l'ingestion.
export const GROUND_TYPES = ["Stabilisé/cendrée", "Sable"] as const;

interface GroundTypeFilterProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function GroundTypeFilter({ selected, onChange }: GroundTypeFilterProps) {
  function toggle(groundType: string) {
    onChange(
      selected.includes(groundType)
        ? selected.filter((g) => g !== groundType)
        : [...selected, groundType],
    );
  }

  return (
    <fieldset className="ground-type-filter">
      <legend>Nature du sol</legend>
      {GROUND_TYPES.map((groundType) => (
        <label key={groundType}>
          <input
            type="checkbox"
            checked={selected.includes(groundType)}
            onChange={() => toggle(groundType)}
          />
          {groundType}
        </label>
      ))}
    </fieldset>
  );
}
