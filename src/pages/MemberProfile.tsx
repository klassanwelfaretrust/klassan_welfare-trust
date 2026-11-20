import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Dict } from '../lib/i18n';
export function MemberProfile({ t }: { t: Dict }) {
  const { uid } = useParams(); const [p, setP] = useState<any>(null); const [error, setError] = useState('');
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, 'member_profiles', uid))
      .then((s) => { if (s.exists()) setP(s.data()); else setError(t.msg_notFound); })
      .catch(() => setError(t.msg_loadError));
  }, [uid]);
  if (error) return <div className="card"><p className="error">{error}</p><p><Link to="/members">← {t.btn_back}</Link></p></div>;
  if (!p) return <p>{t.msg_loading}</p>;
  return (<div><p><Link to="/members">← {t.btn_back}</Link></p>
    <div className="card"><h1>{p.fullName}</h1>
    {p.photoUrl && <img src={p.photoUrl} alt={p.fullName} className="preview" />}
    <p>{t.f_fatherName}: {p.fatherName}</p><p>{t.f_address}: {p.address}</p>
    <p>{t.f_occupation}: {p.occupation}</p><p>{t.f_skills}: {p.skills ?? '—'}</p>
    <p>{t.f_category}: {t[`role_${p.role}`] ?? p.role}</p>
    <p><small>{t.profile_privacy_note}</small></p></div></div>);
}
