import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializePresident } from '../firebase/auth';
import { PRESIDENT_OATH } from '../lib/i18n';
// Verbatim oath (also exported as PRESIDENT_OATH in src/lib/i18n.ts and stored
// by the initializePresident Cloud Function):
// "مجھے خوشی ہے کہ میں اپنی قوم کا ایک ذمہ دار باصلاحیت اور قابل اعتماد رکن بنا ہوں۔ قوم نے مل کر ایک ذمہ داری کا بہت بڑا بوجھ میرے کندھوں پر رکھا ہے میرے لیے بہت نہیں بلکہ فخر کی بات ہے۔ میں اپنی اس ڈیوٹی کو ایمانداری کے ساتھ نبھاؤں گا۔ جس مدت تک میں صدر ہوں جو کام میرے ذمے ہوگا جتنا ہو سکا اپنی قوم کی خدمت کروں گا۔ اپنا کام مکمل ایمانداری اور دیانتداری سے کروں گا اپنے باقی دوستوں کو بھی ساتھ لے کے چلوں گا۔" 
import { isValidCnic, isValidEmail, isValidPassword, required } from '../lib/validation';
import type { Dict } from '../lib/i18n';

// First screen on first-ever access. The oath text below is verbatim from the
// brief; agreement is stored with the record by the Cloud Function.
export function PresidentRegister({ t }: { t: Dict }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', cnic: '', fatherName: '', address: '', occupation: '', email: '', password: '' });
  const [oath, setOath] = useState(false);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!required(form.fullName) || !required(form.fatherName) || !required(form.address) || !required(form.occupation)) return setError(t.v_required);
    if (!isValidCnic(form.cnic)) return setError(t.v_cnic);
    if (!isValidEmail(form.email)) return setError(t.v_email);
    if (!isValidPassword(form.password)) return setError(t.v_password);
    if (!oath) return setError(t.v_oath);
    setBusy(true);
    try { await initializePresident({ ...form, oathAgreed: true }); navigate('/dashboard'); }
    catch (err: any) { setError(err?.message?.includes('already') ? t.msg_presidentExists : (err?.message ?? t.msg_error)); } finally { setBusy(false); }
  }
  return (
    <div className="card">
      <h1>{t.role_president} — {t.appName}</h1>
      <form onSubmit={submit}>
        <label className="field"><span>{t.f_fullName}</span><input value={form.fullName} onChange={set('fullName')} /></label>
        <label className="field"><span>{t.f_cnic}</span><input value={form.cnic} onChange={set('cnic')} placeholder="35202-1234567-1" dir="ltr" /></label>
        <label className="field"><span>{t.f_fatherName}</span><input value={form.fatherName} onChange={set('fatherName')} /></label>
        <label className="field"><span>{t.f_address}</span><textarea value={form.address} onChange={set('address')} /></label>
        <label className="field"><span>{t.f_occupation}</span><input value={form.occupation} onChange={set('occupation')} /></label>
        <label className="field"><span>{t.f_email}</span><input type="email" value={form.email} onChange={set('email')} /></label>
        <label className="field"><span>{t.f_password}</span><input type="password" value={form.password} onChange={set('password')} /></label>
        <h2>{t.oath_title}</h2>
        <p className="oath" dir="rtl" lang="ur">{PRESIDENT_OATH}</p>
        <label className="field"><span><input type="checkbox" checked={oath} onChange={(e) => setOath(e.target.checked)} /> {t.oath_agree}</span></label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? t.msg_loading : t.btn_submit}</button>
      </form>
    </div>
  );
}
