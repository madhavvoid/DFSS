function FolderDialog({ name, busy, onNameChange, onCreate, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="folder-dialog" onSubmit={onCreate}>
        <button className="dialog-close" type="button" aria-label="Close" onClick={onClose}>×</button>
        <span className="dialog-kicker">NEW FOLDER</span>
        <h2>Name this folder</h2>
        <label htmlFor="folder-name">Folder name</label>
        <input id="folder-name" autoFocus maxLength={120} value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Untitled folder" />
        <div className="dialog-actions"><button type="button" className="cancel-action" onClick={onClose}>Cancel</button><button className="solid-action" type="submit" disabled={!name.trim() || busy}>Create folder</button></div>
      </form>
    </div>
  );
}

export default FolderDialog;