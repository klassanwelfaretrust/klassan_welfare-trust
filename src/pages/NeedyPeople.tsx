import { useEffect, useState } from 'react';
import { listNeedy, addNeedy } from '../services/records';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import { EmptyState } from '../components/EmptyState';
import type { Dict } from '../lib/i18n';
export function NeedyPeople({ t }: { t: Dict }) {
  const { user } = useAuth(); const { isPresident, isSuperAdmin } = useRole();
  const [rows, setRows] = useState<any[]>([]); const [name, setName] = useState(''); const [need, setNeed] = useState('');
  const load = () => listNeedy().then(setRows).catch(() => {});
  useEffect(() => { load(); }, []);
  async function add(e: React.FormEvent) { e.preventDefault(); if (!user || !name) return; await addNeedy(user.uid, { fullName: name, need }); setName(''); setNeed(''); load(); }
  return (<div><h1>{t.nav_needy}</h1>
    {(isPresident || isSuperAdmin) && (<form className="card" onSubmit={add}>
      <label className="field"><span>{t.f_person}</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="field"><span>{t.f_need}</span><input value={need} onChange={(e) => setNeed(e.target.value)} /></label>
      <button className="btn">{t.btn_save}</button></form>)}
    {rows.length === 0 ? <EmptyState message={t.msg_noData} /> : rows.map((r) => <div className="card" key={r.id}><strong>{r.fullName}</strong><p>{r.need ?? ''}</p></div>)}
  </div>);
}
