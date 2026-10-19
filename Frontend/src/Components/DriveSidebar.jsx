function DriveSidebar({ busy, activeSection, onUpload, isGoogle, isBackend, onSelectSection }) {
  const sections = [
    { id: "dashboard", label: "Dashboard", glyph: "⌂" },
    { id: "files", label: "My Files", glyph: "▰" },
    { id: "upload", label: "Upload Files", glyph: "↑" },
    { id: "nodes", label: "Storage Nodes", glyph: "▤" },
    { id: "activity", label: "Activity", glyph: "◷" },
    { id: "settings", label: "Settings", glyph: "⚙" },
  ];

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
    </aside>
  );
}

export default DriveSidebar;