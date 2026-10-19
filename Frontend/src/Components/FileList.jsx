import EntryIcon from "./EntryIcon";
import { formatBytes, formatDate, isFolder } from "../utils/fileUtils";

function FileList({ entries, loading, search, activeView, isGoogle, isBackend, busy, layout, sortKey, onSortChange, onLayoutChange, onUpload, onOpenEntry, onDeleteEntry, onDrop, error, notice, onDismissError, onDismissNotice }) {
  return (
    <>
      {error && <div className="notice notice-error" role="alert"><span>{error}</span><button type="button" onClick={onDismissError} aria-label="Dismiss error">×</button></div>}
      {notice && <div className="notice notice-success" role="status"><span>{notice}</span><button type="button" onClick={onDismissNotice} aria-label="Dismiss notice">×</button></div>}
      <div className="file-toolbar">
        <span>{search ? `${entries.length} results` : `${entries.length} ${entries.length === 1 ? "item" : "items"}`}</span>
        <div className="toolbar-controls">
          <label className="sort-control">Sort <select aria-label="Sort files" value={sortKey} onChange={(event) => onSortChange(event.target.value)}><option value="name">Name</option><option value="modifiedTime">Last modified</option><option value="size">File size</option></select></label>
          <div className="view-toggle" aria-label="File layout">
            <button className={layout === "list" ? "selected" : ""} type="button" aria-label="List view" aria-pressed={layout === "list"} onClick={() => onLayoutChange("list")}>☷</button>
            <button className={layout === "grid" ? "selected" : ""} type="button" aria-label="Grid view" aria-pressed={layout === "grid"} onClick={() => onLayoutChange("grid")}>▦</button>
          </div>
        </div>
      </div>
      <section className={`entry-area ${layout === "grid" ? "entry-grid" : "entry-list"}`} aria-label="Files and folders">
        {loading ? <div className="empty-state"><span className="loading-mark" /> Loading files</div> : entries.length ? entries.map((entry) => (
          <article className="entry-row" key={entry.id}>
            <button className="entry-open" type="button" onClick={() => onOpenEntry(entry)} title={isFolder(entry) ? `Open ${entry.name}` : `Download ${entry.name}`}>
              <EntryIcon entry={entry} />
              <span className="entry-name">{entry.name}</span>
            </button>
            <span className="entry-type">{isFolder(entry) ? "Folder" : entry.mimeType?.split("/").pop() || "File"}</span>
            <span className="entry-date">{formatDate(entry.modifiedTime)}</span>
            <span className="entry-size">{isFolder(entry) ? "—" : formatBytes(Number(entry.size || 0))}</span>
            <div className="entry-actions">
              {!isFolder(entry) && <button type="button" aria-label={`Download ${entry.name}`} title="Download" onClick={() => onOpenEntry(entry)}>↓</button>}
              <button type="button" className="remove-entry" aria-label={`Delete ${entry.name}`} title="Delete" onClick={() => onDeleteEntry(entry)}>×</button>
            </div>
          </article>
        )) : (
          <div className="empty-state" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
            <div className="empty-illustration" aria-hidden="true"><span /><span /><span /></div>
            <h2>{search ? "No matching files" : activeView === "recent" ? "Nothing new in your archive." : "Your vault is ready."}</h2>
            <p>{search ? "Try another name or clear the search." : isBackend ? "Upload a file and TPCM will distribute its chunks across healthy storage nodes." : isGoogle ? "Add a file to this connected storage location." : "Drop a file here or add your first item to TPCM."}</p>
            {!search && <button className="empty-upload" type="button" onClick={onUpload} disabled={busy}>Choose files <span aria-hidden="true">↑</span></button>}
          </div>
        )}
      </section>
      <div className="workspace-footnote"><span className="footnote-dot" /> {isBackend ? "Files are chunked and replicated across available DFSS storage nodes." : isGoogle ? "Files are saved to your Google Drive account." : "Browser storage stays on this device and is not uploaded to a server."}</div>
    </>
  );
}

export default FileList;