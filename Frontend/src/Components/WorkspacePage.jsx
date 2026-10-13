import { useEffect, useRef, useState } from "react";
import AuthDialog from "./AuthDialog";
import DeleteDialog from "./DeleteDialog";
import DriveHeader from "./DriveHeader";
import DriveSidebar from "./DriveSidebar";
import FileList from "./FileList";
import FolderDialog from "./FolderDialog";
import { connectGoogleAccount } from "../services/googleAuth";
import {
  createFolder,
  deleteEntry,
  downloadEntry,
  FOLDER_MIME_TYPE,
  listEntries,
  uploadEntries,
} from "../services/storageService";
import "./DriveWorkspace.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function WorkspacePage() {
  const [mode, setMode] = useState("local");
  const [accessToken, setAccessToken] = useState("");
  const [profile, setProfile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [folderPath, setFolderPath] = useState([{ id: null, name: "Vault" }]);
  const [activeView, setActiveView] = useState("drive");
  const [recentSince, setRecentSince] = useState(0);
  const [layout, setLayout] = useState("list");
  const [sortKey, setSortKey] = useState("name");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [authIntent, setAuthIntent] = useState("signin");
  const [authOpen, setAuthOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [folderOpen, setFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const uploadInput = useRef(null);
  const currentFolder = folderPath[folderPath.length - 1];
  const isGoogle = mode === "google";

  useEffect(() => {
    let cancelled = false;
    listEntries(mode, accessToken, currentFolder.id)
      .then((result) => {
        if (!cancelled) setEntries(result);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || "Could not load this folder.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [mode, accessToken, currentFolder.id, refreshKey]);

  useEffect(() => {
    if (!authOpen && !folderOpen && !deleteTarget) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setAuthOpen(false);
        setFolderOpen(false);
        setDeleteTarget(null);
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [authOpen, folderOpen, deleteTarget]);

  const visibleEntries = entries
    .filter((entry) => entry.name.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((entry) => activeView !== "recent" || Date.parse(entry.modifiedTime) >= recentSince)
    .sort((first, second) => {
      if (first.mimeType === FOLDER_MIME_TYPE && second.mimeType !== FOLDER_MIME_TYPE) return -1;
      if (second.mimeType === FOLDER_MIME_TYPE && first.mimeType !== FOLDER_MIME_TYPE) return 1;
      if (activeView === "recent" || sortKey === "modifiedTime") return Date.parse(second.modifiedTime || 0) - Date.parse(first.modifiedTime || 0);
      if (sortKey === "size") return Number(second.size || 0) - Number(first.size || 0);
      return first.name.localeCompare(second.name);
    });
  const fileCount = entries.filter((entry) => entry.mimeType !== FOLDER_MIME_TYPE).length;
  const folderSize = entries.reduce((total, entry) => total + Number(entry.size || 0), 0);

  function refresh() {
    setLoading(true);
    setError("");
    setRefreshKey((value) => value + 1);
  }

  function openAuth(intent) {
    setAuthIntent(intent);
    setAuthError("");
    setAuthOpen(true);
  }

  async function handleGoogleConnect() {
    if (!GOOGLE_CLIENT_ID) {
      setAuthError("Google Drive is not configured yet. Add VITE_GOOGLE_CLIENT_ID to Frontend/.env.local, or use the browser workspace for now.");
      return;
    }

    setBusy(true);
    setAuthError("");
    try {
      const result = await connectGoogleAccount(GOOGLE_CLIENT_ID, authIntent);
      setAccessToken(result.token);
      setProfile(result.profile);
      setMode("google");
      setLoading(true);
      setError("");
      setFolderPath([{ id: null, name: "Vault" }]);
      setActiveView("drive");
      setAuthOpen(false);
      setNotice("Connected to Google Drive.");
    } catch (connectionError) {
      setAuthError(connectionError.message || "Could not connect to Google Drive.");
    } finally {
      setBusy(false);
    }
  }

  function useLocalWorkspace() {
    setMode("local");
    setLoading(true);
    setError("");
    setAccessToken("");
    setProfile(null);
    setFolderPath([{ id: null, name: "Vault" }]);
    setActiveView("drive");
    setAuthOpen(false);
    setAuthError("");
  }

  async function handleUpload(event) {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await uploadEntries(mode, accessToken, selectedFiles, currentFolder.id);
      setNotice(`${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} added.`);
      refresh();
    } catch (uploadError) {
      setError(uploadError.message || "Upload failed.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function handleDrop(event) {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files || []);
    if (!droppedFiles.length) return;
    setBusy(true);
    setError("");
    try {
      await uploadEntries(mode, accessToken, droppedFiles, currentFolder.id);
      setNotice(`${droppedFiles.length} file${droppedFiles.length === 1 ? "" : "s"} added.`);
      refresh();
    } catch (uploadError) {
      setError(uploadError.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateFolder(event) {
    event.preventDefault();
    const trimmedName = folderName.trim();
    if (!trimmedName) return;
    setBusy(true);
    setError("");
    try {
      await createFolder(mode, accessToken, trimmedName, currentFolder.id);
      setFolderName("");
      setFolderOpen(false);
      setNotice(`Folder “${trimmedName}” created.`);
      refresh();
    } catch (folderError) {
      setError(folderError.message || "Could not create the folder.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    setError("");
    try {
      await deleteEntry(mode, accessToken, deleteTarget);
      setNotice(`“${deleteTarget.name}” removed.`);
      setDeleteTarget(null);
      refresh();
    } catch (deleteError) {
      setError(deleteError.message || "Could not remove this item.");
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenEntry(entry) {
    if (entry.mimeType === FOLDER_MIME_TYPE) {
      setFolderPath((path) => [...path, { id: entry.id, name: entry.name }]);
      setLoading(true);
      setActiveView("drive");
      setSearch("");
      return;
    }
    try {
      await downloadEntry(mode, accessToken, entry);
    } catch (downloadError) {
      setError(downloadError.message || "Could not download this file.");
    }
  }

  function navigateTo(index) {
    setFolderPath((path) => path.slice(0, index + 1));
    setLoading(true);
    setActiveView("drive");
    setSearch("");
  }

  function disconnectGoogle() {
    setAccessToken("");
    setProfile(null);
    setMode("local");
    setLoading(true);
    setError("");
    setFolderPath([{ id: null, name: "Vault" }]);
    setActiveView("drive");
  }

  function selectView(view) {
    if (view === "recent") setRecentSince(Date.now() - 30 * 24 * 60 * 60 * 1000);
    setActiveView(view);
  }

  return (
    <div className="drive-app">
      <DriveHeader search={search} onSearch={setSearch} profile={profile} onDisconnect={disconnectGoogle} onOpenAuth={openAuth} />
      <div className="workspace-layout">
        <DriveSidebar
          busy={busy}
          activeView={activeView}
          onUpload={() => uploadInput.current?.click()}
          onCreateFolder={() => { setFolderName(""); setFolderOpen(true); }}
          onSelectView={selectView}
          folderSize={folderSize}
          fileCount={fileCount}
          isGoogle={isGoogle}
          onConnect={() => openAuth("signin")}
          onDisconnect={disconnectGoogle}
        />
        <input ref={uploadInput} className="visually-hidden" type="file" multiple onChange={handleUpload} />
        <main className="file-main" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
          <section className="vault-banner">
            <div className="vault-intro-copy">
              <div className="vault-kicker"><span /> INDEPENDENT FILE STORAGE <i>/ TPCM—01</i></div>
              <h2>Your files,<br />on your terms.</h2>
              <p>A considered space for your digital archive. Organize files here or connect a storage account when you need it.</p>
              <div className="vault-status">
                <span className="status-led" />
                <div><small>ACTIVE STORAGE</small><strong>{isGoogle ? "CONNECTED DRIVE" : "PRIVATE TO THIS DEVICE"}</strong></div>
              </div>
            </div>
            <div className="vault-index" role="img" aria-label="TPCM Vault file index and storage layers">
              <div className="index-head"><span>FILE / 001</span><span>VAULT SYSTEM</span></div>
              <div className="index-mark"><img src="/tpcm-vault-mark.svg" alt="" /></div>
              <div className="index-lines"><span /><span /><span /></div>
              <div className="index-foot"><span>ARCHIVE INDEX</span><span>TP—CM / {isGoogle ? "REMOTE" : "LOCAL"}</span></div>
            </div>
          </section>
          <div className="page-topline">
            <div><div className="eyebrow">ARCHIVE INDEX <span>·</span> {isGoogle ? "CONNECTED STORAGE" : "PERSONAL STORAGE"}</div><h1>{activeView === "recent" ? "Recently added" : currentFolder.name === "Vault" ? "Vault contents" : currentFolder.name}</h1></div>
            <div className="main-actions">
              <button className="outline-action" type="button" onClick={() => { setFolderName(""); setFolderOpen(true); }} disabled={busy}>New folder</button>
              <button className="solid-action" type="button" onClick={() => uploadInput.current?.click()} disabled={busy}><span aria-hidden="true">↑</span> Upload files</button>
            </div>
          </div>
          <div className="breadcrumbs" aria-label="Folder location">
            {folderPath.map((folder, index) => (
              <span className="breadcrumb-part" key={`${folder.id || "root"}-${index}`}>
                {index > 0 && <span className="breadcrumb-separator" aria-hidden="true">/</span>}
                <button type="button" aria-current={index === folderPath.length - 1 ? "page" : undefined} onClick={() => navigateTo(index)}>{folder.name}</button>
              </span>
            ))}
            {activeView === "recent" && <span className="recent-note">LAST 30 DAYS</span>}
          </div>
          <FileList
            entries={visibleEntries}
            loading={loading}
            search={search}
            activeView={activeView}
            isGoogle={isGoogle}
            busy={busy}
            layout={layout}
            sortKey={sortKey}
            onSortChange={setSortKey}
            onLayoutChange={setLayout}
            onUpload={() => uploadInput.current?.click()}
            onOpenEntry={handleOpenEntry}
            onDeleteEntry={setDeleteTarget}
            onDrop={handleDrop}
            error={error}
            notice={notice}
            onDismissError={() => setError("")}
            onDismissNotice={() => setNotice("")}
          />
        </main>
      </div>
      {authOpen && <AuthDialog intent={authIntent} busy={busy} error={authError} onConnectGoogle={handleGoogleConnect} onUseLocal={useLocalWorkspace} onClose={() => setAuthOpen(false)} />}
      {folderOpen && <FolderDialog name={folderName} busy={busy} onNameChange={setFolderName} onCreate={handleCreateFolder} onClose={() => setFolderOpen(false)} />}
      {deleteTarget && <DeleteDialog entry={deleteTarget} isGoogle={isGoogle} busy={busy} onDelete={handleDelete} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}

export default WorkspacePage;