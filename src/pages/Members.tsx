import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMembers } from '../services/roles';
import { removeMember } from '../services/applications';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { useRole } from '../hooks/useRole';
import type { Dict } from '../lib/i18n';
export function Members({ t }: { t: Dict }) {
  const { isPresident, isSuperAdmin } = useRole();
  const [members, setMembers] = useState<any[]>([]); const [q, setQ] = useState('');
  const [error, setError] = useState(''); const [msg, setMsg] = useState('');
  const [confirmUid, setConfirmUid] = useState<string | null>(null);
  const load = () => listMembers().then(setMembers).catch(() => setError(t.msg_loadError));
  useEffect(() => { load(); }, []);
  const canRemove = isPresident || isSuperAdmin;
  async function remove(uid: string) {
    try { await removeMember(uid, 'Removed by admin'); setConfirmUid(null); setMsg(t.msg_removed); load(); }
    catch (e: any) { setError(e?.message ?? t.msg_error); setConfirmUid(null); }
  }
  const filtered = members.filter((m) => (m.fullName as string)?.toLowerCase().includes(q.toLowerCase()));
  return (<div><h1>{t.nav_members}</h1>
    <input className="field" placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} style={{ padding: 12, width: '100%', borderRadius: 10, border: '1px solid var(--line)' }} />
    {error && <p className="error">{error}</p>}
    {msg && <p>{msg}</p>}
    {filtered.length === 0 ? <EmptyState message={t.msg_noData} /> : filtered.map((m) => (
      <div className="card" key={m.id}><Link to={`/members/${m.uid ?? m.id}`}><strong>{m.fullName}</strong></Link><p>{m.occupation ?? ''} · {t[`role_${m.role}`] ?? m.role}</p>
        {canRemove && m.role === 'member' && <button className="btn ghost" onClick={() => setConfirmUid(m.uid ?? m.id)}>{t.btn_remove}</button>}</div>))}
    {confirmUid && <ConfirmDialog message={t.confirm_remove} t={t} onCancel={() => setConfirmUid(null)} onConfirm={() => remove(confirmUid)} />}
  </div>);
}
