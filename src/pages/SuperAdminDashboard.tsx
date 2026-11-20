import { useEffect, useState } from 'react';
import { createInvitation } from '../services/invitations';
import { InviteLinkCard } from '../components/InviteLinkCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { listAssistantFor } from '../services/roles';
import { dismissUser } from '../services/applications';
import { useRole } from '../hooks/useRole';
import type { Dict } from '../lib/i18n';
export function SuperAdminDashboard({ t }: { t: Dict }) {
  const { user } = useRole();
  const [assistantInvite, setAssistantInvite] = useState<{ url: string; expiresAt: string } | null>(null);
  const [memberInvite, setMemberInvite] = useState<{ url: string; expiresAt: string } | null>(null);
  const [assistant, setAssistant] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmDismiss, setConfirmDismiss] = useState(false);
  useEffect(() => {
    if (user?.uid) listAssistantFor(user.uid).then((r) => setAssistant(r[0] ?? null)).catch(() => {});
  }, [user?.uid]);
  async function mk(role: 'assistant' | 'member', setter: typeof setAssistantInvite) {
    setError(''); setMsg('');
    try { const r = await createInvitation(role, role === 'assistant' ? user?.uid : undefined); setter({ url: `${window.location.origin}${r.url}`, expiresAt: r.expiresAt }); }
    catch (e: any) { setError(e?.message ?? t.msg_error); }
  }
  async function dismissAssistant() {
    if (!assistant) return;
    try { await dismissUser(assistant.uid ?? assistant.id, 'Dismissed by Super Admin'); setConfirmDismiss(false); setAssistant(null); setMsg(t.msg_dismissed); }
    catch (e: any) { setError(e?.message ?? t.msg_error); setConfirmDismiss(false); }
  }
  return (
    <div>
      <h1>{t.dashboard_super}</h1>
      {assistant ? (
        <div className="card"><h2>{t.dashboard_assistant_exists}</h2>
          <p><strong>{assistant.fullName}</strong></p>
          <button className="btn ghost" onClick={() => setConfirmDismiss(true)}>{t.btn_dismiss}</button>
        </div>
      ) : (
        <div className="card"><h2>{t.btn_createAssistantLink}</h2><p>{t.dashboard_assistant_note}</p>
          <button className="btn" onClick={() => mk('assistant', setAssistantInvite)}>{t.btn_createAssistantLink}</button>
          {assistantInvite && <InviteLinkCard title={t.btn_createAssistantLink} url={assistantInvite.url} expiresAt={assistantInvite.expiresAt} t={t} />}</div>
      )}
      <div className="card"><h2>{t.btn_createMemberLink}</h2>
        <button className="btn" onClick={() => mk('member', setMemberInvite)}>{t.btn_createMemberLink}</button>
        {memberInvite && <InviteLinkCard title={t.btn_createMemberLink} url={memberInvite.url} expiresAt={memberInvite.expiresAt} t={t} />}</div>
      {error && <p className="error">{error}</p>}
      {msg && <p>{msg}</p>}
      {confirmDismiss && <ConfirmDialog message={t.confirm_dismiss} t={t} onCancel={() => setConfirmDismiss(false)} onConfirm={dismissAssistant} />}
    </div>
  );
}
