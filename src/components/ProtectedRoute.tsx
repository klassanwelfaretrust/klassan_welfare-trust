import { Navigate } from 'react-router-dom';
import { useRole, type Role } from '../hooks/useRole';
import { logout } from '../firebase/auth';
import type { Dict } from '../lib/i18n';
// C5: a signed-in user whose role is 'pending' (application not yet
// approved) is NOT sent to the dashboard — they see a waiting-for-approval
// message instead, and no internal page renders for them.
export function ProtectedRoute({ roles, children, t }: { roles?: Role[]; children: JSX.Element; t?: Dict }) {
  const { user, role, loading } = useRole();
  if (loading) return <p>{t?.msg_loading ?? 'Loading…'}</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'pending') {
    return (
      <div className="card">
        <h1>{t?.role_pending ?? 'Pending approval'}</h1>
        <p>{t?.msg_waitingApproval ?? 'Your registration is waiting for approval.'}</p>
        <button className="btn ghost" onClick={async () => { await logout(); }}>{t?.nav_logout ?? 'Log out'}</button>
      </div>
    );
  }
  if (roles && role && !roles.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}
