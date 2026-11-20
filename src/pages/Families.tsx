import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listApprovedFamilies } from '../services/families';
import { listApprovedWidows } from '../services/records';
import { EmptyState } from '../components/EmptyState';
import type { Dict } from '../lib/i18n';
export function Families({ t }: { t: Dict }) {
  const [families, setFamilies] = useState<any[]>([]);
  const [widows, setWidows] = useState<any[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    listApprovedFamilies().then(setFamilies).catch(() => setError(t.msg_loadError));
    listApprovedWidows().then(setWidows).catch(() => setError(t.msg_loadError));
  }, []);
  return (<div><h1>{t.nav_families}</h1>
    {error && <p className="error">{error}</p>}
    <div className="row" style={{ marginBottom: 16 }}>
      <Link className="btn" to="/families/new">{t.btn_addFamily}</Link>
      <Link className="btn gold" to="/widows/new">{t.btn_addWidow}</Link>
    </div>
    {families.length === 0 ? <EmptyState message={t.msg_noData} /> : families.map((f) => (
      <div className="card" key={f.id}><Link to={`/families/${f.id}`}><strong>{f.headName}</strong></Link><p>{f.headOccupation} · {f.householdCount} people</p></div>))}
    <h2>{t.h_widows}</h2>
    {widows.length === 0 ? <p>{t.msg_noData}</p> : widows.map((w) => (
      <div className="card" key={w.id}><strong>{w.widowName ?? w.headName}</strong>{w.address ? <p>{w.address}</p> : null}</div>))}
  </div>);
}
