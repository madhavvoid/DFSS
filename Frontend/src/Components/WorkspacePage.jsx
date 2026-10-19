import { useEffect, useRef, useState } from "react";
import AuthDialog from "./AuthDialog";
import DeleteDialog from "./DeleteDialog";
import DriveHeader from "./DriveHeader";
import DriveSidebar from "./DriveSidebar";
import FileList from "./FileList";
import FolderDialog from "./FolderDialog";
import AuthLandingPage from "./AuthLandingPage/AuthLandingPage";
import AuthPage from "./AuthPage/AuthPage";
import DashboardView from "./AppViews/DashboardView";
import UploadView from "./AppViews/UploadView";
import StorageNodesView from "./AppViews/StorageNodesView";
import ActivityView from "./AppViews/ActivityView";
import SettingsView from "./AppViews/SettingsView";
import "./AppViews/AppViews.css";
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
  const [authSession, setAuthSession] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("dfss-auth-session") || "null");
    } catch {
      return null;
    }
  });
  const [mode, setMode] = useState("backend");
  const [accessToken, setAccessToken] = useState("");
  const [profile, setProfile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [folderPath, setFolderPath] = useState([{ id: null, name: "Vault" }]);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [activeView, setActiveView] = useState("drive");
  const [activityItems, setActivityItems] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("dfss-activity-items") || "[]");
    } catch {
      return [];
    }
  });
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
  const [authPageOpen, setAuthPageOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [folderOpen, setFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const uploadInput = useRef(null);
  const currentFolder = folderPath[folderPath.length - 1];
  const isGoogle = mode === "google";
  const isBackend = mode === "backend";
  const storageToken = isBackend ? authSession?.token : accessToken;

  useEffect(() => {
    sessionStorage.setItem("dfss-activity-items", JSON.stringify(activityItems));
  }, [activityItems]);

  useEffect(() => {
    if (!authSession) return undefined;
    let cancelled = false;
    listEntries(mode, storageToken, currentFolder.id)
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
  }, [mode, storageToken, currentFolder.id, refreshKey, authSession]);

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

  function recordActivity(type, name) {
    setActivityItems((items) => [{
      id: `${Date.now()}-${Math.random()}`,
      type,
      name,
      at: new Date().toISOString(),
    }, ...items].slice(0, 50));
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
      recordActivity("Connected storage", "Google Drive");
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
      await uploadEntries(mode, storageToken, selectedFiles, currentFolder.id);
      recordActivity("Uploaded", selectedFiles.map((file) => file.name).join(", "));
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
      await uploadEntries(mode, storageToken, droppedFiles, currentFolder.id);
      recordActivity("Uploaded", droppedFiles.map((file) => file.name).join(", "));
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
      await createFolder(mode, storageToken, trimmedName, currentFolder.id);
      recordActivity("Created folder", trimmedName);
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
      await deleteEntry(mode, storageToken, deleteTarget);
      recordActivity("Deleted", deleteTarget.name);
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
      await downloadEntry(mode, storageToken, entry);
      recordActivity("Downloaded", entry.name);
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
    setMode("backend");
    setLoading(true);
    setError("");
    setFolderPath([{ id: null, name: "Vault" }]);
    setActiveView("drive");
  }

  function selectView(view) {
    if (view === "recent") setRecentSince(Date.now() - 30 * 24 * 60 * 60 * 1000);
    setActiveView(view);
  }

  function selectSection(section) {
    setActiveSection(section);
    if (section === "files") setActiveView("drive");
  }

  function handleAuthenticated(session) {
    sessionStorage.setItem("dfss-auth-session", JSON.stringify(session));
    setAuthSession(session);
    setMode("backend");
    setAccessToken("");
    setActiveSection("dashboard");
    setActiveView("drive");
    setLoading(true);
    setError("");
    setAuthPageOpen(false);
  }

  function signOut() {
    sessionStorage.removeItem("dfss-auth-session");
    sessionStorage.removeItem("dfss-activity-items");
    setAuthSession(null);
    setAuthPageOpen(false);
    setMode("local");
    setAccessToken("");
    setProfile(null);
  }

  if (!authSession && authPageOpen) {
    return <AuthPage initialIntent={authIntent} onAuthenticated={handleAuthenticated} onBack={() => setAuthPageOpen(false)} />;
  }

  if (!authSession) {
    return <AuthLandingPage onOpenAuth={(intent) => { setAuthIntent(intent); setAuthPageOpen(true); }} />;
  }

  return (
    <div className="drive-app">
      <DriveHeader search={search} onSearch={setSearch} profile={profile} account={authSession.user} onSignOut={signOut} onDisconnect={disconnectGoogle} onOpenAuth={openAuth} />
      <div className="workspace-layout">
        <DriveSidebar
          busy={busy}
          activeSection={activeSection}
          onUpload={() => uploadInput.current?.click()}
          onSelectSection={selectSection}
          folderSize={folderSize}
          fileCount={fileCount}
          isGoogle={isGoogle}
          isBackend={isBackend}
          onConnect={() => openAuth("signin")}
          onDisconnect={disconnectGoogle}
        />
        <input ref={uploadInput} className="visually-hidden" type="file" multiple onChange={handleUpload} />
        <main className="file-main" onDragOver={(event) => event.preventDefault()} onDrop={activeSection === "files" ? handleDrop : undefined}>
          {activeSection === "dashboard" && <DashboardView user={authSession.user} entries={entries} loading={loading} error={error} onDismissError={() => setError("")} activityItems={activityItems} isGoogle={isGoogle} isBackend={isBackend} onNavigate={selectSection} onUpload={() => selectSection("upload")} />}
          {activeSection === "upload" && <UploadView busy={busy} isGoogle={isGoogle} isBackend={isBackend} onChooseFiles={() => uploadInput.current?.click()} onDrop={handleDrop} error={error} notice={notice} onDismissError={() => setError("")} onDismissNotice={() => setNotice("")} />}
          {activeSection === "nodes" && <StorageNodesView token={authSession.token} />}
          {activeSection === "activity" && <ActivityView items={activityItems} />}
          {activeSection === "settings" && <SettingsView user={authSession.user} isGoogle={isGoogle} isBackend={isBackend} onConnect={() => openAuth("signin")} onDisconnect={disconnectGoogle} onSignOut={signOut} />}
          {activeSection === "files" && (
            <>
              <div className="page-topline">
                <div><div className="eyebrow">MY FILES <span>·</span> {isBackend ? "DISTRIBUTED STORAGE" : isGoogle ? "CONNECTED STORAGE" : "PERSONAL STORAGE"}</div><h1>{activeView === "recent" ? "Recently added" : currentFolder.name === "Vault" ? "Vault contents" : currentFolder.name}</h1></div>
                <div className="main-actions">
                  <button className="outline-action" type="button" onClick={() => selectView(activeView === "recent" ? "drive" : "recent")}>{activeView === "recent" ? "All files" : "Recently added"}</button>
                  {!isBackend && <button className="outline-action" type="button" onClick={() => { setFolderName(""); setFolderOpen(true); }} disabled={busy}>New folder</button>}
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
                isBackend={isBackend}
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
            </>
          )}
        </main>
      </div>
      {authOpen && <AuthDialog intent={authIntent} busy={busy} error={authError} onConnectGoogle={handleGoogleConnect} onUseLocal={useLocalWorkspace} onClose={() => setAuthOpen(false)} />}
      {folderOpen && <FolderDialog name={folderName} busy={busy} onNameChange={setFolderName} onCreate={handleCreateFolder} onClose={() => setFolderOpen(false)} />}
      {deleteTarget && <DeleteDialog entry={deleteTarget} isGoogle={isGoogle} busy={busy} onDelete={handleDelete} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}

export default WorkspacePage;