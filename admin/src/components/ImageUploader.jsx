import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const MAX_SIZE_MB = 5;

/** Validates files client-side (the server validates again, including magic bytes). */
export function validateImageFiles(files, { maxFiles, currentCount = 0 }) {
  const accepted = [];
  const errors = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) errors.push(`${file.name}: unsupported type (use JPG, PNG, WEBP, AVIF)`);
    else if (file.size > MAX_SIZE_MB * 1024 * 1024) errors.push(`${file.name}: larger than ${MAX_SIZE_MB} MB`);
    else if (currentCount + accepted.length >= maxFiles) errors.push(`${file.name}: maximum of ${maxFiles} images reached`);
    else accepted.push(file);
  }
  return { accepted, errors };
}

/**
 * Multi-image uploader with drag & drop, previews, validation, reordering and removal.
 *
 * `existing`: [{ url, publicId }] already stored on the server.
 * `files`: File[] newly selected.
 * Order: existing images first (in order), then new files.
 */
export default function ImageUploader({ existing = [], onExistingChange, files = [], onFilesChange, maxFiles = 10, multiple = true, error }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = (list) => {
    const incoming = Array.from(list || []);
    if (!incoming.length) return;
    const { accepted, errors } = validateImageFiles(incoming, { maxFiles: multiple ? maxFiles : 1, currentCount: multiple ? existing.length + files.length : 0 });
    errors.forEach((e) => toast.error(e));
    if (!accepted.length) return;
    onFilesChange(multiple ? [...files, ...accepted] : accepted.slice(0, 1));
    if (!multiple && existing.length) onExistingChange?.([]);
  };

  const moveExisting = (i, dir) => {
    const next = [...existing];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onExistingChange(next);
  };

  const total = existing.length + files.length;

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${dragging ? 'border-brand-500 bg-brand-50' : error ? 'border-rose-300 bg-rose-50/40' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'}`}
      >
        <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M4 16l4.6-4.6a2 2 0 0 1 2.8 0L16 16m-2-2 1.6-1.6a2 2 0 0 1 2.8 0L20 14M14 8h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" /></svg>
        <p className="mt-2 text-sm font-medium text-slate-700">Drop {multiple ? 'images' : 'an image'} here or <span className="text-brand-600">browse</span></p>
        <p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP or AVIF · max {MAX_SIZE_MB} MB{multiple ? ` · up to ${maxFiles} images (${total}/${maxFiles})` : ''}</p>
        <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')} multiple={multiple} className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

      {total > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {existing.map((img, i) => (
            <li key={img.publicId || img.url} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] text-white">Cover</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 to-transparent p-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                {multiple ? (
                  <span className="flex gap-1">
                    <button type="button" onClick={() => moveExisting(i, -1)} className="rounded bg-white/90 px-1.5 text-xs" aria-label="Move left">←</button>
                    <button type="button" onClick={() => moveExisting(i, 1)} className="rounded bg-white/90 px-1.5 text-xs" aria-label="Move right">→</button>
                  </span>
                ) : <span />}
                <button type="button" onClick={() => onExistingChange(existing.filter((_, idx) => idx !== i))} className="rounded bg-rose-600 px-1.5 text-xs text-white" aria-label="Remove image">✕</button>
              </div>
            </li>
          ))}
          {files.map((file, i) => (
            <li key={`${file.name}-${file.lastModified}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border-2 border-brand-300 bg-slate-100">
              {previews[i] && <img src={previews[i]} alt={file.name} className="h-full w-full object-cover" />}
              <span className="absolute left-1 top-1 rounded bg-brand-500 px-1.5 py-0.5 text-[10px] text-white">{existing.length === 0 && i === 0 ? 'Cover · new' : 'New'}</span>
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              <button type="button" onClick={() => onFilesChange(files.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 rounded bg-rose-600 px-1.5 text-xs text-white" aria-label="Remove image">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
