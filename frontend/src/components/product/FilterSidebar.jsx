import { useEffect, useState } from 'react';
import { formatPrice } from '../../utils/format.js';

const COLOR_SWATCHES = {
  'yellow gold': '#d4a017',
  'rose gold': '#d68f7c',
  'white gold': '#e5e7eb',
  platinum: '#d1d5db',
  silver: '#c0c4c8',
};

function Section({ title, children }) {
  return (
    <details open className="border-b border-stone-200 py-4">
      <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-widest text-stone-700">{title}</summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

const PRICE_PRESETS = [
  [0, 5000],
  [5000, 25000],
  [25000, 75000],
  [75000, null],
];

/**
 * Controlled filter panel. `values` reflects URL params; `onChange(patch)` updates them.
 */
export default function FilterSidebar({ options, values, onChange, onClear }) {
  const selected = (key) => (values[key] ? values[key].split(',') : []);
  const toggleValue = (key, value) => {
    const current = selected(key);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ [key]: next.join(',') || undefined });
  };

  const [min, setMin] = useState(values.minPrice || '');
  const [max, setMax] = useState(values.maxPrice || '');
  useEffect(() => {
    setMin(values.minPrice || '');
    setMax(values.maxPrice || '');
  }, [values.minPrice, values.maxPrice]);

  const hasFilters = ['material', 'color', 'size', 'minPrice', 'maxPrice', 'inStock'].some((k) => values[k]);

  return (
    <div>
      <div className="flex items-center justify-between pb-2">
        <p className="font-display text-xl font-semibold">Filters</p>
        {hasFilters && <button onClick={onClear} className="text-xs text-gold-700 underline">Clear all</button>}
      </div>

      <Section title="Price">
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS.map(([lo, hi]) => {
            const active = String(values.minPrice || '') === String(lo || '') && String(values.maxPrice || '') === String(hi || '');
            return (
              <button
                key={`${lo}-${hi}`}
                onClick={() => onChange(active ? { minPrice: undefined, maxPrice: undefined } : { minPrice: lo || undefined, maxPrice: hi || undefined })}
                className={`chip ${active ? 'border-ink bg-ink text-white' : 'border-stone-300 hover:border-ink'}`}
              >
                {hi ? `${formatPrice(lo)} – ${formatPrice(hi)}` : `${formatPrice(lo)}+`}
              </button>
            );
          })}
        </div>
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onChange({ minPrice: min || undefined, maxPrice: max || undefined });
          }}
        >
          <input type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} placeholder={options?.price?.min ? `${Math.floor(options.price.min)}` : 'Min'} className="input py-2" aria-label="Minimum price" />
          <span className="text-stone-400">–</span>
          <input type="number" min="0" value={max} onChange={(e) => setMax(e.target.value)} placeholder={options?.price?.max ? `${Math.ceil(options.price.max)}` : 'Max'} className="input py-2" aria-label="Maximum price" />
          <button className="btn-outline px-3 py-2">Go</button>
        </form>
      </Section>

      {options?.materials?.length > 0 && (
        <Section title="Material">
          <div className="space-y-2">
            {options.materials.map((m) => (
              <label key={m.value} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-gold-600" checked={selected('material').includes(m.value)} onChange={() => toggleValue('material', m.value)} />
                <span className="flex-1">{m.value}</span>
                <span className="text-xs text-stone-400">{m.count}</span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {options?.colors?.length > 0 && (
        <Section title="Metal Colour">
          <div className="flex flex-wrap gap-2">
            {options.colors.map((c) => {
              const active = selected('color').includes(c.value);
              return (
                <button key={c.value} onClick={() => toggleValue('color', c.value)} className={`chip gap-2 ${active ? 'border-ink bg-ink text-white' : 'border-stone-300 hover:border-ink'}`} aria-pressed={active}>
                  <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: COLOR_SWATCHES[c.value.toLowerCase()] || '#ccc' }} />
                  {c.value}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {options?.sizes?.length > 0 && (
        <Section title="Size">
          <div className="flex flex-wrap gap-2">
            {options.sizes.map((s) => {
              const active = selected('size').includes(s.value);
              return (
                <button key={s.value} onClick={() => toggleValue('size', s.value)} className={`chip min-w-11 justify-center ${active ? 'border-ink bg-ink text-white' : 'border-stone-300 hover:border-ink'}`} aria-pressed={active}>
                  {s.value}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      <div className="py-4">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-gold-600" checked={values.inStock === 'true'} onChange={(e) => onChange({ inStock: e.target.checked ? 'true' : undefined })} />
          In stock only
        </label>
      </div>
    </div>
  );
}
