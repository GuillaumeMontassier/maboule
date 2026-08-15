interface CheckboxFilterProps {
  legend: string;
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function CheckboxFilter({ legend, options, selected, onChange }: CheckboxFilterProps) {
  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <fieldset className="flex flex-col gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
      <legend>{legend}</legend>
      {options.map((value) => (
        <label key={value} className="flex items-center gap-1.5 font-normal">
          <input type="checkbox" checked={selected.includes(value)} onChange={() => toggle(value)} />
          {value}
        </label>
      ))}
    </fieldset>
  );
}
