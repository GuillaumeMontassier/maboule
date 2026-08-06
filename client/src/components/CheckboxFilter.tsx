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
    <fieldset className="checkbox-filter">
      <legend>{legend}</legend>
      {options.map((value) => (
        <label key={value}>
          <input type="checkbox" checked={selected.includes(value)} onChange={() => toggle(value)} />
          {value}
        </label>
      ))}
    </fieldset>
  );
}
