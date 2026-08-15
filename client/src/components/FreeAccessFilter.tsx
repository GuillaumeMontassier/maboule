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
    <label className="flex flex-col gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
      Accès
      <select
        value={value === undefined ? "" : String(value)}
        onChange={handleChange}
        className="dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
      >
        <option value="">Tous</option>
        <option value="true">Accès libre</option>
        <option value="false">Accès payant / restreint</option>
      </select>
    </label>
  );
}
