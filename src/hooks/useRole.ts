import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';
export type Role = 'president' | 'super_admin' | 'assistant' | 'member' | 'pending' | null;
export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<Role>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setRole(null); setProfile(null); setLoading(false); return; }
    return onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setRole((snap.data()?.role as Role) ?? 'pending');
      setProfile(snap.data() ?? null); setLoading(false);
    });
  }, [user, authLoading]);
  return { user, role, profile, loading, isPresident: role === 'president', isSuperAdmin: role === 'super_admin', isAssistant: role === 'assistant', isMember: role === 'member' };
}
