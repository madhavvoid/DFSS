import { FOLDER_MIME_TYPE } from "../../services/storageService";
import { formatBytes, formatDate } from "../../utils/fileUtils";

function DashboardView({ user, entries, loading, error, onDismissError, activityItems, isGoogle, isBackend, onNavigate, onUpload }) {
  const files = entries.filter((entry) => entry.mimeType !== FOLDER_MIME_TYPE);
  const folders = entries.filter((entry) => entry.mimeType === FOLDER_MIME_TYPE);
  const totalBytes = files.reduce((sum, entry) => sum + Number(entry.size || 0), 0);
  const chunkCount = files.reduce((sum, entry) => sum + Number(entry.chunkCount || 0), 0);
  const recentFiles = [...files].sort((first, second) => Date.parse(second.modifiedTime || 0) - Date.parse(first.modifiedTime || 0)).slice(0, 4);

  return (
    <section className="app-view dashboard-view">
      <div className="view-heading dashboard-heading">
        <div><span className="view-kicker">YOUR WORKSPACE</span><h1>Dashboard</h1><p>Welcome back, {user.name || user.email || user.phone}.</p></div>
        <button className="solid-action" type="button" onClick={onUpload}><span aria-hidden="true">↑</span> Upload files</button>
      </div>
      {error && <div className="notice notice-error" role="alert"><span>{error}</span><button type="button" onClick={onDismissError} aria-label="Dismiss error">×</button></div>}
      <div className="dashboard-summary" aria-label="Storage summary">
        <article className="summary-metric"><span>FILES</span><strong>{loading ? "—" : files.length}</strong><small>in this location</small></article>
        <article className="summary-metric"><span>{isBackend ? "DISTRIBUTED CHUNKS" : "FOLDERS"}</span><strong>{loading ? "—" : isBackend ? chunkCount : folders.length}</strong><small>{isBackend ? "across your files" : "at the vault root"}</small></article>
        <article className="summary-metric"><span>FILE DATA</span><strong>{loading ? "—" : formatBytes(totalBytes)}</strong><small>{isBackend ? "stored across DFSS nodes" : isGoogle ? "Google Drive" : "this device"}</small></article>
      </div>
      <div className="dashboard-columns">
        <section className="dashboard-panel recent-files-panel">
          <div className="panel-heading"><div><span className="view-kicker">ARCHIVE</span><h2>Recent files</h2></div><button type="button" className="text-action" onClick={() => onNavigate("files")}>View all <span aria-hidden="true">↗</span></button></div>
          {loading ? <p className="panel-empty">Loading your archive…</p> : recentFiles.length ? (
            <div className="recent-file-list">
              {recentFiles.map((entry) => <div className="recent-file-row" key={entry.id}><span className="recent-file-type">{entry.mimeType?.split("/").pop()?.slice(0, 4).toUpperCase() || "FILE"}</span><strong>{entry.name}</strong><small>{formatDate(entry.modifiedTime)}</small></div>)}
            </div>
          ) : <p className="panel-empty">Your archive is ready for its first file.</p>}
        </section>
        <section className="dashboard-panel dashboard-activity-panel">
          <div className="panel-heading"><div><span className="view-kicker">THIS SESSION</span><h2>Recent activity</h2></div><button type="button" className="text-action" onClick={() => onNavigate("activity")}>History <span aria-hidden="true">↗</span></button></div>
          {activityItems.length ? <ul className="dashboard-activity-list">{activityItems.slice(0, 4).map((item) => <li key={item.id}><span className="activity-marker" /><div><strong>{item.type}</strong><small>{item.name}</small></div><time>{formatDate(item.at)}</time></li>)}</ul> : <p className="panel-empty">Uploads, downloads, and folder changes will appear here.</p>}
        </section>
      </div>
      <section className="dashboard-shortcuts" aria-label="Workspace shortcuts">
        <button type="button" onClick={() => onNavigate("files")}><span>▰</span><strong>My Files</strong><small>Browse files and folders</small><b>↗</b></button>
        <button type="button" onClick={onUpload}><span>↑</span><strong>Upload Files</strong><small>Add files to your archive</small><b>↗</b></button>
        <button type="button" onClick={() => onNavigate("nodes")}><span>▤</span><strong>Storage Nodes</strong><small>View distributed storage</small><b>↗</b></button>
      </section>
    </section>
  );
}

export default DashboardView;