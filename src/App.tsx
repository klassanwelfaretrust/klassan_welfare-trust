import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { getDict, detectLang, type Lang } from './lib/i18n';
import { PresidentRegister } from './pages/PresidentRegister';
import { Login } from './pages/Login';
import { PresidentDashboard } from './pages/PresidentDashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { AssistantDashboard } from './pages/AssistantDashboard';
import { MemberDashboard } from './pages/MemberDashboard';
import { RegisterByInvite } from './pages/RegisterByInvite';
import { Members } from './pages/Members';
import { MemberProfile } from './pages/MemberProfile';
import { Families } from './pages/Families';
import { FamilyForm } from './pages/FamilyForm';
import { FamilyDetail } from './pages/FamilyDetail';
import { WidowForm } from './pages/WidowForm';
import { NeedyPeople } from './pages/NeedyPeople';
import { SickPeople } from './pages/SickPeople';
import { PendingApprovals } from './pages/PendingApprovals';
import { MyProfile } from './pages/MyProfile';
import { useRole } from './hooks/useRole';
import { listMembers } from './services/roles';

function DashboardRouter({ t }: { t: Record<string, string> }) {
  const { role, loading } = useRole();
  if (loading) return <p>{t.msg_loading}</p>;
  if (role === 'president') return <PresidentDashboard t={t} />;
  if (role === 'super_admin') return <SuperAdminDashboard t={t} />;
  if (role === 'assistant') return <AssistantDashboard t={t} />;
  return <MemberDashboard t={t} />;
}
function Home({ t }: { t: Record<string, string> }) {
  // H5: Home lists approved members (real data only). Signed-out visitors
  // see the welcome only — the directory query needs a signed-in member.
  const [members, setMembers] = useState<any[]>([]);
  useEffect(() => { listMembers().then(setMembers).catch(() => {}); }, []);
  return (
    <div>
      <section className="card"><h1>{t.home_welcome}</h1><p>{t.home_intro}</p><p>{t.appNameUr}</p></section>
      <section className="grid">
        <div className="card"><h2>{t.nav_families}</h2><p>{t.btn_addFamily} · {t.btn_addWidow}</p></div>
        <div className="card"><h2>{t.nav_members}</h2><p>{t.nav_members}</p></div>
        <div className="card"><h2>{t.nav_needy}</h2><p>{t.nav_needy}</p></div>
        <div className="card"><h2>{t.nav_sick}</h2><p>{t.nav_sick}</p></div>
      </section>
      {members.length > 0 && (
        <section className="card"><h2>{t.nav_members}</h2>
          {members.map((m) => (
            <p key={m.id}><strong>{m.fullName}</strong>{m.occupation ? ` · ${m.occupation}` : ''} · {t[`role_${m.role}`] ?? m.role}</p>
          ))}
        </section>
      )}
    </div>
  );
}
export default function App() {
  const [lang, setLangState] = useState<Lang>(detectLang());
  const t = getDict(lang);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    localStorage.setItem('kwt-lang', lang);
  }, [lang]);
  const setLang = (l: Lang) => setLangState(l);
  return (
    <Routes>
      <Route element={<Layout t={t} lang={lang} setLang={setLang} />}>
        <Route index element={<Home t={t} />} />
        <Route path="/president-register" element={<PresidentRegister t={t} />} />
        <Route path="/login" element={<Login t={t} />} />
        <Route path="/register/:invitationId" element={<RegisterByInvite t={t} />} />
        <Route path="/dashboard" element={<ProtectedRoute t={t}><DashboardRouter t={t} /></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute t={t}><Members t={t} /></ProtectedRoute>} />
        <Route path="/members/:uid" element={<ProtectedRoute t={t}><MemberProfile t={t} /></ProtectedRoute>} />
        <Route path="/families" element={<ProtectedRoute t={t}><Families t={t} /></ProtectedRoute>} />
        <Route path="/families/new" element={<ProtectedRoute t={t}><FamilyForm t={t} /></ProtectedRoute>} />
        <Route path="/families/:familyId" element={<ProtectedRoute t={t}><FamilyDetail t={t} /></ProtectedRoute>} />
        <Route path="/widows/new" element={<ProtectedRoute t={t} roles={['president', 'super_admin']}><WidowForm t={t} /></ProtectedRoute>} />
        <Route path="/needy" element={<ProtectedRoute t={t}><NeedyPeople t={t} /></ProtectedRoute>} />
        <Route path="/sick" element={<ProtectedRoute t={t}><SickPeople t={t} /></ProtectedRoute>} />
        <Route path="/pending" element={<ProtectedRoute t={t} roles={['president', 'super_admin']}><PendingApprovals t={t} /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute t={t}><MyProfile t={t} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
