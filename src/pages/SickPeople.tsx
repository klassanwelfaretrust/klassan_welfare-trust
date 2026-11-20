import { useEffect, useState } from 'react';
import { listSick, addSick } from '../services/records';
import { removeSickPerson } from '../services/applications';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import { EmptyState } from '../components/EmptyState';
import type { Dict } from '../lib/i18n';
export function SickPeople({ t }: { t: Dict }) {
  const { user } = useAuth(); const { isPresident, isSuperAdmin } = useRole();
  const [rows, setRows] = useState<any[]>([]); const [name, setName] = useState(''); const [illness, setIllness] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const load = () => listSick().then(setRows).catch(() => {});
  useEffect(() => { load(); }, []);
  async function add(e: React.FormEvent) { e.preventDefault(); if (!user || !name || !illness) return; await addSick(user.uid, { personName: name, illness }); setName(''); setIllness(''); load(); }
  // Removal deactivates ONLY the sick record — family + member records are untouched.
  async function remove(id: string) { await removeSickPerson(id, 'Recovered'); setConfirmId(null); load(); }
  return (<div><h1>{t.nav_sick}</h1>
    {(isPresident || isSuperAdmin) && (<form className="card" onSubmit={add}>
      <label className="field"><span>{t.f_person}</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="field"><span>{t.f_illness}</span><input value={illness} onChange={(e) => setIllness(e.target.value)} /></label>
      <button className="btn">{t.btn_save}</button></form>)}
    {rows.length === 0 ? <EmptyState message={t.msg_noData} /> : rows.map((r) => (
      <div className="card" key={r.id}><strong>{r.personName}</strong><p>{r.illness}</p>
        {(isPresident || isSuperAdmin) && <button className="btn ghost" onClick={() => setConfirmId(r.id)}>{t.btn_remove}</button>}</div>))}
    {confirmId && <ConfirmDialog message={t.confirm_remove} t={t} onCancel={() => setConfirmId(null)} onConfirm={() => remove(confirmId)} />}
  </div>);
}
