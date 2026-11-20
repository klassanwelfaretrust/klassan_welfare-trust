import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFamilyDetail } from '../services/families';
import { getFamilyVotes, submitFamilyVote, type Category } from '../services/votes';
import { StatusBadge } from '../components/StatusBadge';
import { useRole } from '../hooks/useRole';
import type { Dict } from '../lib/i18n';
export function FamilyDetail({ t }: { t: Dict }) {
  const { familyId } = useParams(); const { role, user } = useRole();
  const [detail, setDetail] = useState<any>(null); const [votes, setVotes] = useState<any>(null); const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!familyId) return;
    getFamilyDetail(familyId).then(setDetail).catch(() => setError(t.msg_loadError));
    getFamilyVotes(familyId).then(setVotes).catch(() => {});
  }, [familyId]);
  if (error) return <div className="card"><p className="error">{error}</p><p><Link to="/families">← {t.btn_back}</Link></p></div>;
  if (!detail) return <p>{t.msg_loading}</p>;
  if (!detail.family) return <div className="card"><p className="error">{t.msg_notFound}</p><p><Link to="/families">← {t.btn_back}</Link></p></div>;
  const f = detail.family;
  const alreadyVoted = votes?.votes?.some((v: any) => v.voterUid === user?.uid);
  async function vote(cat: Category) {
    try { const r = await submitFamilyVote(familyId!, cat); setMsg(r.finalised ? `Final category: ${t[`cat_${r.finalised}`]}` : t.msg_saved); getFamilyVotes(familyId!).then(setVotes); }
    catch (e: any) { setMsg(e?.message ?? t.msg_error); }
  }
  return (<div>
    <p><Link to="/families">← {t.btn_back}</Link></p>
    <div className="card"><h1>{f.headName}</h1><StatusBadge status={f.status} t={t} />
      <p>{t.f_headOccupation}: {f.headOccupation}</p><p>{t.f_household}: {f.householdCount}</p></div>
    <div className="card"><h2>{t.h_familyMembers}</h2>
      {detail.members.map((m: any) => <p key={m.id}>{m.relation}: <strong>{m.fullName}</strong> — {m.occupation} {m.age ? `· ${m.age}` : ''}</p>)}
    </div>
    <div className="card"><h2>{t.vote_title}</h2><p>{t.vote_hint}</p>
      <p>{t.h_votesCast}: {votes?.votes.length ?? 0} / 4 {votes?.finalCategory ? `· Final: ${t[`cat_${votes.finalCategory}`]}` : ''}</p>
      {votes?.votes.map((v: any) => <p key={v.id}>{v.voterUid}: {t[`cat_${v.category}`]}</p>)}
      {role === 'super_admin' && !votes?.finalCategory && !alreadyVoted && (<div className="row">
        {(['upper', 'middle', 'third'] as Category[]).map((c) => <button key={c} className="btn" onClick={() => vote(c)}>{t[`cat_${c}`]}</button>)}
      </div>)}
      {msg && <p>{msg}</p>}
    </div>
  </div>);
}
