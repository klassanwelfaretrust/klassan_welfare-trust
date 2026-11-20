export function StatusBadge({ status, t }: { status: string; t: Record<string, string> }) {
  const label = t[`s_${status}`] ?? status;
  return <span className={`badge badge-${status}`}>{label}</span>;
}
