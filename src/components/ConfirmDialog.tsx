export function ConfirmDialog({ message, onConfirm, onCancel, t }: { message: string; onConfirm: () => void; onCancel: () => void; t: Record<string, string> }) {
  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog">
        <p>{message}</p>
        <div className="row">
          <button className="btn danger" onClick={onConfirm}>{t.btn_confirm}</button>
          <button className="btn ghost" onClick={onCancel}>{t.btn_cancel}</button>
        </div>
      </div>
    </div>
  );
}
