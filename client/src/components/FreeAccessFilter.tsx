import type { ChangeEvent } from "react";

interface FreeAccessFilterProps {
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
}

export function FreeAccessFilter({ value, onChange }: FreeAccessFilterProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const raw = event.target.value;
    onChange(raw === "" ? undefined : raw === "true");
  }

  return (
    <label className="checkbox-filter">
      Accès
      <select value={value === undefined ? "" : String(value)} onChange={handleChange}>
        <option value="">Tous</option>
        <option value="true">Accès libre</option>
        <option value="false">Accès payant / restreint</option>
      </select>
    </label>
  );
}
