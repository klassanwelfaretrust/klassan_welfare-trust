import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { checkInvitation } from '../services/invitations';
import { registerApplicant } from '../firebase/auth';
import { ImageUpload } from '../components/ImageUpload';
import { uploadIdentityImage, uploadProfilePhoto } from '../services/storage';
import { isValidCnic, isValidEmail, isValidPassword, required } from '../lib/validation';
import type { Dict } from '../lib/i18n';

// Single-use invite registration (Super Admin / Assistant / Local Member).
// Token is validated by the Function; a used/expired token is rejected here
// and server-side. No public registration route exists.
export function RegisterByInvite({ t }: { t: Dict }) {
  const { invitationId } = useParams(); const [search] = useSearchParams(); const navigate = useNavigate();
  const token = search.get('token') ?? '';
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ fullName: '', fatherName: '', cnic: '', address: '', skills: '', occupation: '', email: '', password: '' });
  const [files, setFiles] = useState<{ front?: File; back?: File; photo?: File }>({});
  useEffect(() => {
    if (!invitationId || !token) { setError(t.msg_inviteUsed); return; }
    // Read-only check only — this must NOT use the invitation up. It is
    // redeemed exactly once, inside registerApplicant when the form is submitted.
    checkInvitation(invitationId, token).then((r) => setRole(r.forRole)).catch(() => setError(t.msg_inviteUsed));
  }, [invitationId, token]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!Object.values(form).every(required)) return setError(t.v_required);
    if (!isValidCnic(form.cnic)) return setError(t.v_cnic);
    if (!isValidEmail(form.email) || !isValidPassword(form.password)) return setError(t.v_email);
    if (!files.front || !files.back || !files.photo) return setError(t.v_required);
    setBusy(true);
    try {
      // Order matters (Storage rules allow owner-only writes): 1) the Function
      // redeems the invite exactly once and creates the Auth user; 2) sign in
      // as that user; 3) upload CNIC/photo under the real uid; 4) attach URLs.
      const created = await registerApplicant({ invitationId, token, ...form }) as unknown as { uid: string };
      const { login } = await import('../firebase/auth');
      await login(form.email, form.password);
      const uid = (created as any)?.uid ?? '';
      const [cnicFrontUrl, cnicBackUrl, photoUrl] = await Promise.all([
        uploadIdentityImage(uid, 'cnic-front', files.front), uploadIdentityImage(uid, 'cnic-back', files.back), uploadProfilePhoto(uid, files.photo),
      ]);
      const { httpsCallable } = await import('firebase/functions');
      const { getFunctions } = await import('firebase/functions');
      const { app } = await import('../firebase/config');
      await httpsCallable(getFunctions(app), 'completeApplicantDocuments')({ cnicFrontUrl, cnicBackUrl, photoUrl });
      navigate('/login');
    } catch (err: any) { setError(err?.message ?? t.msg_error); } finally { setBusy(false); }
  }
  if (error) return <div className="card"><p className="error">{error}</p></div>;
  if (!role) return <p>{t.msg_loading}</p>;
  return (
    <div className="card">
      <h1>{t[`role_${role}`] ?? role} — Registration</h1>
      <p><small>{role === 'assistant' ? t.msg_applicantPendingAssistant : t.msg_applicantPending}</small></p>
      <form onSubmit={submit}>
        <label className="field"><span>{t.f_fullName}</span><input value={form.fullName} onChange={set('fullName')} /></label>
        <label className="field"><span>{t.f_fatherName}</span><input value={form.fatherName} onChange={set('fatherName')} /></label>
        <label className="field"><span>{t.f_cnic}</span><input value={form.cnic} onChange={set('cnic')} placeholder="35202-1234567-1" dir="ltr" /></label>
        <label className="field"><span>{t.f_address}</span><textarea value={form.address} onChange={set('address')} /></label>
        <label className="field"><span>{t.f_skills}</span><input value={form.skills} onChange={set('skills')} /></label>
        <label className="field"><span>{t.f_occupation}</span><input value={form.occupation} onChange={set('occupation')} /></label>
        <label className="field"><span>{t.f_email}</span><input type="email" value={form.email} onChange={set('email')} /></label>
        <label className="field"><span>{t.f_password}</span><input type="password" value={form.password} onChange={set('password')} /></label>
        <ImageUpload label={t.f_cnicFront} t={t} onFile={(f) => setFiles({ ...files, front: f })} />
        <ImageUpload label={t.f_cnicBack} t={t} onFile={(f) => setFiles({ ...files, back: f })} />
        <ImageUpload label={t.f_photo} t={t} acceptCapture onFile={(f) => setFiles({ ...files, photo: f })} />
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? t.msg_loading : t.btn_submit}</button>
      </form>
    </div>
  );
}
