import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createInvitation, listActiveSuperAdminInvites } from '../services/invitations';
import { InviteLinkCard } from '../components/InviteLinkCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { listSuperAdmins } from '../services/roles';
import { listPendingSuperAdminApplications, dismissUser } from '../services/applications';
import { useEffect } from 'react';
import type { Dict } from '../lib/i18n';
export function PresidentDashboard({ t }: { t: Dict }) {
  const [invite, setInvite] = useState<{ url: string; expiresAt: string } | null>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [inviteCount, setInviteCount] = useState(0);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmUid, setConfirmUid] = useState<string | null>(null);
  const load = () => {
    listSuperAdmins().then(setAdmins).catch(() => {});
    listPendingSuperAdminApplications().then((r) => setPendingCount(r.length)).catch(() => {});
    listActiveSuperAdminInvites().then((r) => setInviteCount(r.length)).catch(() => {});
  };
  useEffect(load, []);
  // M6: the 4-seat limit counts active Super Admins + pending applications
  // + unused invitations, not actives alone.
  const seatsUsed = admins.length + pendingCount + inviteCount;
  async function createLink() {
    setError(''); setMsg('');
    try {
      const r = await createInvitation('super_admin');
      setInvite({ url: `${window.location.origin}${r.url}`, expiresAt: r.expiresAt });
      load();
    } catch (e: any) { setError(e?.message ?? t.msg_error); }
  }
  async function dismiss(uid: string) {
    try { await dismissUser(uid, 'Dismissed by President'); setConfirmUid(null); setMsg(t.msg_dismissed); load(); }
    catch (e: any) { setError(e?.message ?? t.msg_error); setConfirmUid(null); }
  }
  return (
    <div>
      <h1>{t.dashboard_president}</h1>
      <div className="card">
        <h2>{t.btn_createLink}</h2>
        <p>{t.dashboard_president_note.replace('{n}', String(admins.length))}</p>
        <button className="btn gold" onClick={createLink} disabled={seatsUsed >= 4}>{t.btn_createLink}</button>
        {error && <p className="error">{error}</p>}
        {msg && <p>{msg}</p>}
        {invite && <InviteLinkCard title={t.btn_createLink} url={invite.url} expiresAt={invite.expiresAt} t={t} />}
      </div>
      <div className="card">
        <h2>{t.role_super_admin}</h2>
        {admins.length === 0 ? <p>{t.msg_noData}</p> : admins.map((a) => (
          <div key={a.id} className="row" style={{ justifyContent: 'space-between' }}>
            <span>{a.fullName}</span>
            <button className="btn ghost" onClick={() => setConfirmUid(a.uid ?? a.id)}>{t.btn_dismiss}</button>
          </div>))}
        <p><Link to="/pending">{t.nav_pending} →</Link></p>
      </div>
      {confirmUid && <ConfirmDialog message={t.confirm_dismiss} t={t} onCancel={() => setConfirmUid(null)} onConfirm={() => dismiss(confirmUid)} />}
    </div>
  );
}
