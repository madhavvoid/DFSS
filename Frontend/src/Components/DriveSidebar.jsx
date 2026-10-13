import { formatBytes } from "../utils/fileUtils";

function DriveSidebar({ busy, activeView, onUpload, onCreateFolder, onSelectView, folderSize, fileCount, isGoogle, onConnect, onDisconnect }) {
  return (
    <aside className="sidebar">
      <button className="new-upload" type="button" onClick={onUpload} disabled={busy}>
        <span aria-hidden="true">+</span> New upload
      </button>
      <button className="new-folder" type="button" onClick={onCreateFolder} disabled={busy}>
        <span aria-hidden="true">▧</span> New folder
      </button>
      <div className="sidebar-label">ARCHIVE</div>
      <nav className="side-nav" aria-label="Vault views">
        <button className={activeView === "drive" ? "active" : ""} type="button" onClick={() => onSelectView("drive")}>
          <span className="nav-glyph" aria-hidden="true">▰</span> Vault
        </button>
        <button className={activeView === "recent" ? "active" : ""} type="button" onClick={() => onSelectView("recent")}>
          <span className="nav-glyph" aria-hidden="true">◷</span> Recently added
        </button>
      </nav>
      <div className="sidebar-bottom">
        <div className="storage-caption"><span>THIS FOLDER</span><span>{formatBytes(folderSize)}</span></div>
        <div className="storage-rule" aria-hidden="true" />
        <p>{fileCount} {fileCount === 1 ? "file" : "files"} · {isGoogle ? "Google Drive" : "stored in this browser"}</p>
        <div className={`storage-provider ${isGoogle ? "provider-google" : "provider-local"}`}>
          <span className="provider-dot" />
          <div><strong>{isGoogle ? "Google Drive" : "Browser storage"}</strong><small>{isGoogle ? "Account connected" : "Private to this device"}</small></div>
        </div>
        {!isGoogle && <button className="connect-link" type="button" onClick={onConnect}>Connect Google Drive <span aria-hidden="true">↗</span></button>}
        {isGoogle && <button className="connect-link" type="button" onClick={onDisconnect}>Use browser storage</button>}
      </div>
    </aside>
  );
}

export default DriveSidebar;