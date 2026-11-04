function DriveSidebar({ busy, activeSection, onUpload, isGoogle, isBackend, onSelectSection }) {
  const sections = [
    { id: "dashboard", label: "Dashboard", glyph: "⌂" },
    { id: "files", label: "My Files", glyph: "▰" },
    { id: "upload", label: "Upload Files", glyph: "↑" },
    { id: "nodes", label: "Storage Nodes", glyph: "▤" },
    { id: "activity", label: "Activity", glyph: "◷" },
    { id: "settings", label: "Settings", glyph: "⚙" },
  ];

<<<<<<< HEAD
  return (
    <aside className="sidebar product-sidebar">
      <nav className="product-nav" aria-label="Workspace sections">
        {sections.map((section) => (
          <button key={section.id} className={activeSection === section.id ? "active" : ""} type="button" aria-current={activeSection === section.id ? "page" : undefined} onClick={() => onSelectSection(section.id)}>
            <span className="nav-glyph" aria-hidden="true">{section.glyph}</span>{section.label}
          </button>
        ))}
      </nav>
      <button className="new-upload nav-upload" type="button" onClick={onUpload} disabled={busy}>
        <span aria-hidden="true">+</span> Quick upload
      </button>
      <span className="nav-storage"><i /> {isGoogle ? "Google Drive" : isBackend ? "DFSS distributed storage" : "This device"}</span>
=======
function DriveSidebar({ busy, activeView, onUpload, onCreateFolder, onSelectView, folderSize, fileCount, mode, onConnect, onConnectDfss, onDisconnect }) {
  const isGoogle = mode === "google";
  const isDfss = mode === "dfss";
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
>>>>>>> 4f904a9 (changes risky)
    </aside>
  );
}

export default DriveSidebar;