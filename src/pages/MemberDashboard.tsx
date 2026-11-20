import { Link } from 'react-router-dom';
import type { Dict } from '../lib/i18n';
export function MemberDashboard({ t }: { t: Dict }) {
  return (<div><h1>{t.dashboard_member}</h1>
    <div className="grid">
      <div className="card"><h2>{t.nav_members}</h2><Link to="/members">{t.btn_view} →</Link></div>
      <div className="card"><h2>{t.nav_families}</h2><Link to="/families">{t.btn_view} →</Link></div>
      <div className="card"><h2>{t.nav_needy}</h2><Link to="/needy">{t.btn_view} →</Link></div>
      <div className="card"><h2>{t.nav_sick}</h2><Link to="/sick">{t.btn_view} →</Link></div>
    </div></div>);
}
