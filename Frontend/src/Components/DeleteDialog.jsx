function DeleteDialog({ entry, isGoogle, busy, onDelete, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="folder-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
        <button className="dialog-close" type="button" aria-label="Close" onClick={onClose}>×</button>
        <span className="dialog-kicker">REMOVE ITEM</span>
        <h2 id="delete-title">Delete “{entry.name}”?</h2>
        <p className="delete-copy">This removes the item {isGoogle ? "from Google Drive" : "from this browser"}.</p>
        <div className="dialog-actions"><button type="button" className="cancel-action" onClick={onClose}>Cancel</button><button className="delete-action" type="button" onClick={onDelete} disabled={busy}>Delete</button></div>
      </section>
    </div>
  );
}

export default DeleteDialog;