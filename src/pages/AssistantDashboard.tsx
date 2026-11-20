import type { Dict } from '../lib/i18n';
export function AssistantDashboard({ t }: { t: Dict }) {
  return (<div><h1>{t.dashboard_assistant}</h1>
    <div className="card"><p>{t.assistant_info}</p></div></div>);
}
