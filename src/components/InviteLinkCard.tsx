import { useState } from 'react';
export function InviteLinkCard({ title, url, expiresAt, t }: { title: string; url: string; expiresAt: string; t: Record<string, string> }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  async function copy() {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard API blocked (e.g. insecure context) — fall back to a
      // temporary textarea + execCommand, then to a manual-copy message.
      try {
        const ta = document.createElement('textarea');
        ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) setCopied(true); else setCopyError(true);
      } catch { setCopyError(true); }
    }
  }
  return (
    <div className="card invite-card">
      <h3>{title}</h3>
      <p className="mono">{url}</p>
      <p><small>{t.invite_expires ?? 'Expires:'} {new Date(expiresAt).toLocaleString()}</small></p>
      <button className="btn" onClick={copy}>{copied ? '✓ Copied' : 'Copy link'}</button>
      {copied && <p><small>{t.msg_linkCopied}</small></p>}
      {copyError && <p className="error"><small>{t.msg_copyFailed}</small></p>}
    </div>
  );
}
