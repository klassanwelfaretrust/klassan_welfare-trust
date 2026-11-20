import { useRole } from '../hooks/useRole';
import type { Dict } from '../lib/i18n';
export function MyProfile({ t }: { t: Dict }) {
  const { profile, role, loading } = useRole();
  if (loading) return <p>{t.msg_loading}</p>;
  return (<div className="card"><h1>{t.nav_profile}</h1>
    <p><strong>{(profile as any)?.fullName}</strong></p>
    <p>{t[`role_${role ?? ''}`] ?? role}</p>
    <p>{t.f_occupation}: {(profile as any)?.occupation ?? '—'}</p></div>);
}
