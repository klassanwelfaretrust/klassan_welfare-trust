import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitFamily, type ChildEntry, type OtherMember } from '../services/families';
import { useAuth } from '../hooks/useAuth';
import { required } from '../lib/validation';
import type { Dict } from '../lib/i18n';

// Dynamic form: sons 1–10, daughters 1–10, unlimited other members.
// Adding a person never clears previously entered data (state is per-row).
function ChildRows({ label, nameLabel, rows, setRows, t }: { label: string; nameLabel: string; rows: ChildEntry[]; setRows: (r: ChildEntry[]) => void; t: Dict }) {
  return (<fieldset className="card"><legend>{label}</legend>
    {rows.map((r, i) => (<div key={i} className="grid">
      <label className="field"><span>{nameLabel}</span><input value={r.fullName} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, fullName: e.target.value } : x))} /></label>
      <label className="field"><span>{t.f_occupation}</span><input value={r.occupation} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, occupation: e.target.value } : x))} /></label>
      <label className="field"><span>{t.f_age}</span><input type="number" value={r.age} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, age: Number(e.target.value) } : x))} /></label>
    </div>))}
  </fieldset>);
}
export function FamilyForm({ t }: { t: Dict }) {
  const { user } = useAuth(); const navigate = useNavigate();
  const [headName, setHeadName] = useState(''); const [household, setHousehold] = useState(1); const [headOcc, setHeadOcc] = useState('');
  const [sons, setSons] = useState<ChildEntry[]>([]); const [daughters, setDaughters] = useState<ChildEntry[]>([]);
  const [others, setOthers] = useState<OtherMember[]>([{ name: '', status: '' }]);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  // M1: changing the count keeps already-typed rows (grow keeps old rows,
  // shrink keeps the first n) — it no longer rebuilds every row empty.
  const pickCount = (n: number, current: ChildEntry[], setter: (r: ChildEntry[]) => void) =>
    setter(Array.from({ length: n }, (_, i) => current[i] ?? { fullName: '', occupation: '', age: '' as const }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!required(headName) || !required(headOcc)) return setError(t.v_required);
    if ([...sons, ...daughters].some((c) => !required(c.fullName))) return setError(t.msg_childNameRequired);
    if (!user) return setError(t.msg_loginRequired);
    setBusy(true);
    try {
      await submitFamily(user.uid, { headName, householdCount: household, headOccupation: headOcc, sons, daughters, otherMembers: others.filter((o) => required(o.name)) });
      navigate('/families');
    } catch { setError(t.msg_error); } finally { setBusy(false); }
  }
  return (<div className="card"><h1>{t.btn_addFamily}</h1>
    <form onSubmit={submit}>
      <label className="field"><span>{t.f_headName}</span><input value={headName} onChange={(e) => setHeadName(e.target.value)} placeholder="مستری محمد ریاض کلاس" /></label>
      <label className="field"><span>{t.f_household}</span><input type="number" min={1} value={household} onChange={(e) => setHousehold(Number(e.target.value))} /></label>
      <label className="field"><span>{t.f_headOccupation}</span><input value={headOcc} onChange={(e) => setHeadOcc(e.target.value)} /></label>
      <label className="field"><span>{t.f_sonsCount}</span>
        <select value={sons.length} onChange={(e) => pickCount(Number(e.target.value), sons, setSons)}>
          <option value={0}>0</option>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
        </select></label>
      <ChildRows label={t.f_sonsCount} nameLabel={t.f_sonName} rows={sons} setRows={setSons} t={t} />
      <label className="field"><span>{t.f_daughtersCount}</span>
        <select value={daughters.length} onChange={(e) => pickCount(Number(e.target.value), daughters, setDaughters)}>
          <option value={0}>0</option>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
        </select></label>
      <ChildRows label={t.f_daughtersCount} nameLabel={t.f_daughterName} rows={daughters} setRows={setDaughters} t={t} />
      <fieldset className="card"><legend>{t.f_otherMembers}</legend>
        {others.map((o, i) => (<div key={i} className="grid">
          <label className="field"><span>{t.f_personName}</span><input value={o.name} onChange={(e) => setOthers(others.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></label>
          <label className="field"><span>{t.f_personStatus}</span><input value={o.status} onChange={(e) => setOthers(others.map((x, j) => j === i ? { ...x, status: e.target.value } : x))} /></label>
        </div>))}
        <button type="button" className="btn ghost" onClick={() => setOthers([...others, { name: '', status: '' }])}>{t.btn_addPerson}</button>
      </fieldset>
      {error && <p className="error">{error}</p>}
      <p><small>{t.family_pending_note}</small></p>
      <button className="btn" disabled={busy}>{busy ? t.msg_loading : t.btn_submit}</button>
    </form></div>);
}
