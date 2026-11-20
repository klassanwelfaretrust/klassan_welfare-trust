import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addWidow } from '../services/records';
import { useAuth } from '../hooks/useAuth';
import { required } from '../lib/validation';
import type { Dict } from '../lib/i18n';
export function WidowForm({ t }: { t: Dict }) {
  const { user } = useAuth(); const navigate = useNavigate();
  const [name, setName] = useState(''); const [address, setAddress] = useState(''); const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!required(name)) return setError(t.v_required);
    if (!user) return setError(t.msg_loginRequired);
    await addWidow(user.uid, { widowName: name, address, notes }); navigate('/families');
  }
  return (<div className="card"><h1>{t.btn_addWidow}</h1>
    <form onSubmit={submit}>
      <label className="field"><span>{t.f_widowName}</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="field"><span>{t.f_address}</span><textarea value={address} onChange={(e) => setAddress(e.target.value)} /></label>
      <label className="field"><span>{t.f_notes}</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      {error && <p className="error">{error}</p>}
      <button className="btn">{t.btn_submit}</button>
    </form></div>);
}
