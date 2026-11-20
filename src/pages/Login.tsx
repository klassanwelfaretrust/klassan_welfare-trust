import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, resetPassword } from '../firebase/auth';
import { isValidEmail, required } from '../lib/validation';
import type { Dict } from '../lib/i18n';
export function Login({ t }: { t: Dict }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [info, setInfo] = useState(''); const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setInfo('');
    if (!required(email) || !required(password)) return setError(t.v_required);
    if (!isValidEmail(email)) return setError(t.v_email);
    setBusy(true);
    try { await login(email, password); navigate('/dashboard'); }
    catch { setError(t.msg_error); } finally { setBusy(false); }
  }
  async function forgot() {
    setError(''); setInfo('');
    if (!required(email) || !isValidEmail(email)) return setError(t.msg_enterEmailFirst);
    setBusy(true);
    try { await resetPassword(email); setInfo(t.msg_resetSent); }
    catch { setError(t.msg_error); } finally { setBusy(false); }
  }
  return (
    <div className="card">
      <h1>{t.nav_login}</h1>
      <form onSubmit={submit}>
        <label className="field"><span>{t.f_email}</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="field"><span>{t.f_password}</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        {info && <p>{info}</p>}
        <button className="btn" disabled={busy}>{t.nav_login}</button>
      </form>
      <p><button type="button" className="link-btn" onClick={forgot} disabled={busy}>{t.link_forgotPassword}</button></p>
      <p><small>{t.login_note} <Link to="/president-register">{t.link_presidentRegister}</Link>.</small></p>
    </div>
  );
}
