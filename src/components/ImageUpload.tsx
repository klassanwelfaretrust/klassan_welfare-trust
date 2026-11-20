import { useState } from 'react';
import { validateImageFile } from '../lib/validation';
export function ImageUpload({ label, onFile, t, acceptCapture = false }: { label: string; onFile: (f: File) => void; t: Record<string, string>; acceptCapture?: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  return (
    <label className="field">
      <span>{label}</span>
      <input type="file" accept="image/jpeg,image/png,image/webp" capture={acceptCapture ? 'environment' : undefined}
        onChange={(e) => {
          const f = e.target.files?.[0]; if (!f) return;
          const err = validateImageFile(f);
          if (err) { setError(err === 'type' ? t.v_fileType : t.v_fileSize); return; }
          setError(''); setPreview(URL.createObjectURL(f)); onFile(f);
        }} />
      {error && <em className="error">{error}</em>}
      {preview && <img src={preview} alt="Preview" className="preview" />}
    </label>
  );
}
