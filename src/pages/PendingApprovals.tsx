import { useEffect, useState } from 'react';
import { listPendingSuperAdminApplications, listPendingAssistantApplications, listPendingFamilies, listPendingMemberApplications, listPendingWidows, approveSuperAdmin, approveAssistantStage1, approveAssistantStage2, approveFamily, approveMember, approveWidow } from '../services/applications';
import { StatusBadge } from '../components/StatusBadge';
import { useRole } from '../hooks/useRole';
import type { Dict } from '../lib/i18n';
export function PendingApprovals({ t }: { t: Dict }) {
  const { role, user } = useRole();
  const [sas, setSas] = useState<any[]>([]); const [assts, setAssts] = useState<any[]>([]); const [fams, setFams] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]); const [widows, setWidows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const load = () => {
    listPendingSuperAdminApplications().then(setSas).catch(() => {});
    listPendingAssistantApplications(role === 'super_admin' ? user?.uid : undefined).then(setAssts).catch(() => {});
    listPendingFamilies().then(setFams).catch(() => {});
    listPendingMemberApplications().then(setMembers).catch(() => {});
    listPendingWidows().then(setWidows).catch(() => {});
  };
  useEffect(load, [role]);
  async function act(fn: () => Promise<unknown>, ok: string) { try { await fn(); setMsg(ok); load(); } catch (e: any) { setMsg(e?.message ?? t.msg_error); } }
  return (<div><h1>{t.nav_pending}</h1>{msg && <p>{msg}</p>}
    <div className="card"><h2>{t.role_super_admin}</h2>
      {sas.length === 0 ? <p>{t.msg_noData}</p> : sas.map((a) => <div key={a.id}><p>{a.fullName} <StatusBadge status={a.status} t={t} /></p>
        {role === 'president' && <div className="row"><button className="btn" onClick={() => act(() => approveSuperAdmin(a.id, true), t.msg_saved)}>{t.btn_approve}</button>
        <button className="btn ghost" onClick={() => act(() => approveSuperAdmin(a.id, false), t.msg_saved)}>{t.btn_reject}</button></div>}</div>)}
    </div>
    <div className="card"><h2>{t.role_assistant}</h2>
      {assts.length === 0 ? <p>{t.msg_noData}</p> : assts.map((a) => <div key={a.id}><p>{a.fullName} <StatusBadge status={a.status} t={t} /></p>
        <div className="row">
          {role === 'super_admin' && a.status === 'pending_super_admin' && <><button className="btn" onClick={() => act(() => approveAssistantStage1(a.id, true), t.msg_saved)}>{t.btn_approve}</button>
          <button className="btn ghost" onClick={() => act(() => approveAssistantStage1(a.id, false), t.msg_saved)}>{t.btn_reject}</button></>}
          {role === 'president' && a.status === 'pending_president' && <><button className="btn" onClick={() => act(() => approveAssistantStage2(a.id, true), t.msg_saved)}>{t.btn_approve}</button>
          <button className="btn ghost" onClick={() => act(() => approveAssistantStage2(a.id, false), t.msg_saved)}>{t.btn_reject}</button></>}
        </div></div>)}
    </div>
    <div className="card"><h2>{t.role_member}</h2>
      {members.length === 0 ? <p>{t.msg_noData}</p> : members.map((a) => <div key={a.id}><p>{a.fullName} <StatusBadge status={a.status} t={t} /></p>
        <div className="row"><button className="btn" onClick={() => act(() => approveMember(a.id, true), t.msg_saved)}>{t.btn_approve}</button>
        <button className="btn ghost" onClick={() => act(() => approveMember(a.id, false), t.msg_saved)}>{t.btn_reject}</button></div></div>)}
    </div>
    <div className="card"><h2>{t.nav_families}</h2>
      {fams.length === 0 ? <p>{t.msg_noData}</p> : fams.map((f) => <div key={f.id}><p>{f.headName} <StatusBadge status={f.status} t={t} /></p>
        <div className="row"><button className="btn" onClick={() => act(() => approveFamily(f.id, true), t.msg_saved)}>{t.btn_approve}</button>
        <button className="btn ghost" onClick={() => act(() => approveFamily(f.id, false), t.msg_saved)}>{t.btn_reject}</button></div></div>)}
    </div>
    <div className="card"><h2>{t.h_widows}</h2>
      {widows.length === 0 ? <p>{t.msg_noData}</p> : widows.map((w) => <div key={w.id}><p>{w.widowName ?? w.headName} <StatusBadge status={w.status} t={t} /></p>
        <div className="row"><button className="btn" onClick={() => act(() => approveWidow(w.id, true), t.msg_saved)}>{t.btn_approve}</button>
        <button className="btn ghost" onClick={() => act(() => approveWidow(w.id, false), t.msg_saved)}>{t.btn_reject}</button></div></div>)}
    </div>
  </div>);
}
