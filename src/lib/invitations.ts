// Invitation links are single-use, 7-day, role-scoped. The raw token is never
// stored — only its SHA-256 hash lives in Firestore (see Functions).
// URL shape: /register/:invitationId?token=<raw token, shown once to creator>
export function invitationUrl(origin: string, invitationId: string, token: string) {
  return `${origin}/register/${invitationId}?token=${token}`;
}
export function parseInvitation(location: { pathname: string; search: string }) {
  const id = location.pathname.split('/').filter(Boolean).pop() ?? '';
  const token = new URLSearchParams(location.search).get('token') ?? '';
  return { invitationId: id, token };
}
