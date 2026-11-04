import { formatBytes } from "../utils/fileUtils";

function DriveSidebar({ busy, activeView, onUpload, onCreateFolder, onSelectView, folderSize, fileCount, mode, onConnect, onConnectDfss, onDisconnect }) {
  const isGoogle = mode === "google";
  const isDfss = mode === "dfss" || mode === "backend";
  const providerName = isGoogle ? "Google Drive" : isDfss ? "DFSS coordinator" : "Browser storage";
  const providerDetail = isGoogle ? "Account connected" : isDfss ? "Coordinator connected" : "Private to this device";

  return (
    <aside className="sidebar">
      <button className="new-upload" type="button" onClick={onUpload} disabled={busy}>
        <span aria-hidden="true">+</span> New upload
      </button>
      <button className="new-folder" type="button" onClick={onCreateFolder} disabled={busy || isDfss}>
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
        <p>{fileCount} {fileCount === 1 ? "file" : "files"} · {providerName}</p>
        <div className={`storage-provider ${isGoogle ? "provider-google" : isDfss ? "provider-dfss" : "provider-local"}`}>
          <span className="provider-dot" />
          <div><strong>{providerName}</strong><small>{providerDetail}</small></div>
        </div>
        {!isGoogle && !isDfss && (
          <>
            <button className="connect-link" type="button" onClick={onConnect}>Connect Google Drive <span aria-hidden="true">↗</span></button>
            <button className="connect-link" type="button" onClick={onConnectDfss}>Connect DFSS <span aria-hidden="true">↗</span></button>
          </>
        )}
        {(isGoogle || isDfss) && <button className="connect-link" type="button" onClick={onDisconnect}>Use browser storage</button>}
      </div>
    </aside>
  );
}

export default DriveSidebar;