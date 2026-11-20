import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { logout } from '../firebase/auth';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { Dict } from '../lib/i18n';

// Logo: place the Trust's real logo at public/klassan-logo.png (see
// public/logo-placeholder/README.txt). Until then a text wordmark renders;
// no other organisation's logo or stock image is substituted.
export function Layout({ t, lang, setLang }: { t: Dict; lang: string; setLang: (l: 'en' | 'ur') => void }) {
  const { role, user } = useRole();
  const navigate = useNavigate();
  const links: Array<[string, string, boolean]> = [
    ['/', t.nav_home, true],
    ['/members', t.nav_members, !!user],
    ['/families', t.nav_families, !!user],
    ['/needy', t.nav_needy, !!user],
    ['/sick', t.nav_sick, !!user],
    ['/dashboard', t.nav_dashboard, !!user],
    ['/pending', t.nav_pending, role === 'president' || role === 'super_admin'],
    ['/profile', t.nav_profile, !!user],
  ];
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <img src="/klassan-logo.png" alt="Klassan Welfare Trust logo" className="logo" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span className="brand-text"><strong>{t.appName}</strong><small>{t.tagline}</small></span>
        </Link>
        <LanguageSwitcher lang={lang} setLang={setLang} />
      </header>
      <nav className="mainnav" aria-label="Main">
        {links.filter(([, , show]) => show).map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
        {user
          ? <button className="link-btn" onClick={async () => { await logout(); navigate('/login'); }}>{t.nav_logout}</button>
          : <Link to="/login">{t.nav_login}</Link>}
      </nav>
      <main className="container"><Outlet /></main>
      <footer className="footer">{t.appName} · {t.appNameUr}</footer>
    </div>
  );
}
