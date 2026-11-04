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
  clearDfssAuth,
  fetchDfssCurrentUser,
  listDfssNodes,
  loginDfssAccount,
  readDfssAuth,
  registerDfssAccount,
} from "../services/dfssApi";
import {
  createFolder,
  deleteEntry,
  downloadEntry,
  FOLDER_MIME_TYPE,
  listEntries,
  uploadEntries,
} from "../services/storageService";
import { formatBytes } from "../utils/fileUtils";
import "./DriveWorkspace.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function WorkspacePage() {
<<<<<<< HEAD
  const [authSession, setAuthSession] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("dfss-auth-session") || "null");
    } catch {
      return null;
    }
  });
  const [mode, setMode] = useState("backend");
=======
  const savedDfssSession = readDfssAuth();
  const [mode, setMode] = useState(savedDfssSession.token ? "dfss" : "local");
>>>>>>> 4f904a9 (changes risky)
  const [accessToken, setAccessToken] = useState("");
  const [dfssToken, setDfssToken] = useState(savedDfssSession.token ?? "");
  const [profile, setProfile] = useState(savedDfssSession.user ?? null);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(savedDfssSession.token || savedDfssSession.user));
  const [entries, setEntries] = useState([]);
  const [dfssNodes, setDfssNodes] = useState([]);
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
<<<<<<< HEAD
  const [authOpen, setAuthOpen] = useState(false);
  const [authPageOpen, setAuthPageOpen] = useState(false);
=======
  const [authOpen, setAuthOpen] = useState(!(savedDfssSession.token || savedDfssSession.user));
>>>>>>> 4f904a9 (changes risky)
  const [authError, setAuthError] = useState("");
  const [folderOpen, setFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const uploadInput = useRef(null);
  const currentFolder = folderPath[folderPath.length - 1];
  const activeToken = mode === "dfss" ? dfssToken : accessToken;
  const isGoogle = mode === "google";
<<<<<<< HEAD
  const isBackend = mode === "backend";
  const storageToken = isBackend ? authSession?.token : accessToken;
=======
  const isDfss = mode === "dfss";
>>>>>>> 4f904a9 (changes risky)

  useEffect(() => {
    sessionStorage.setItem("dfss-activity-items", JSON.stringify(activityItems));
  }, [activityItems]);

  useEffect(() => {
    if (!authSession) return undefined;
    let cancelled = false;
<<<<<<< HEAD
    listEntries(mode, storageToken, currentFolder.id)
=======
    listEntries(mode, activeToken, currentFolder.id)
>>>>>>> 4f904a9 (changes risky)
      .then((result) => {
        if (!cancelled) setEntries(result);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || "Could not load this storage location.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
<<<<<<< HEAD
  }, [mode, storageToken, currentFolder.id, refreshKey, authSession]);
=======
  }, [mode, activeToken, currentFolder.id, refreshKey]);

  useEffect(() => {
    if (mode !== "dfss" || !dfssToken) {
      return undefined;
    }

    let cancelled = false;
    listDfssNodes(dfssToken)
      .then((nodes) => {
        if (!cancelled) setDfssNodes(nodes);
      })
      .catch(() => {
        if (!cancelled) setDfssNodes([]);
      });

    return () => { cancelled = true; };
  }, [mode, dfssToken, refreshKey]);

  useEffect(() => {
    if (!dfssToken || mode !== "dfss") return undefined;

    let cancelled = false;
    fetchDfssCurrentUser(dfssToken)
      .then((user) => {
        if (!cancelled) setProfile(user);
      })
      .catch(() => {
        if (!cancelled) {
          clearDfssAuth();
          setDfssToken("");
          setProfile(null);
          setMode("local");
          setError("Your DFSS session expired. Please sign in again.");
        }
      });

    return () => { cancelled = true; };
  }, [dfssToken, mode]);
>>>>>>> 4f904a9 (changes risky)

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
  const onlineNodeCount = dfssNodes.filter((node) => node.status === "online").length;
  const storageHealth = dfssNodes.length ? (onlineNodeCount ? "Healthy" : "Waiting for node health") : "Unavailable";

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
      setIsAuthenticated(true);
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

  async function handleDfssAuth({ mode: dfssMode, name, email, password }) {
    const trimmedEmail = (email ?? "").trim();
    const trimmedPassword = (password ?? "").trim();
    const trimmedName = (name ?? "").trim();

    if (!trimmedEmail || !trimmedPassword || (dfssMode === "signup" && !trimmedName)) {
      setAuthError("Enter a valid name, email, and password to continue with DFSS.");
      return;
    }

    setBusy(true);
    setAuthError("");
    try {
      const result = dfssMode === "signup"
        ? await registerDfssAccount(trimmedName, trimmedEmail, trimmedPassword)
        : await loginDfssAccount(trimmedEmail, trimmedPassword);

      setDfssToken(result.token);
      setProfile(result.user);
      setMode("dfss");
      setIsAuthenticated(true);
      setLoading(true);
      setError("");
      setFolderPath([{ id: null, name: "Vault" }]);
      setActiveView("drive");
      setAuthOpen(false);
      setNotice(dfssMode === "signup" ? "Created the DFSS account and connected successfully." : "Connected to the DFSS coordinator.");
    } catch (connectionError) {
      setAuthError(connectionError.message || "Could not sign in to the DFSS coordinator.");
    } finally {
      setBusy(false);
    }
  }

  function useLocalWorkspace() {
    setMode("local");
    setIsAuthenticated(true);
    setLoading(true);
    setError("");
    setAccessToken("");
    setDfssToken("");
    clearDfssAuth();
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
<<<<<<< HEAD
      await uploadEntries(mode, storageToken, selectedFiles, currentFolder.id);
      recordActivity("Uploaded", selectedFiles.map((file) => file.name).join(", "));
=======
      await uploadEntries(mode, activeToken, selectedFiles, currentFolder.id);
>>>>>>> 4f904a9 (changes risky)
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
<<<<<<< HEAD
      await uploadEntries(mode, storageToken, droppedFiles, currentFolder.id);
      recordActivity("Uploaded", droppedFiles.map((file) => file.name).join(", "));
=======
      await uploadEntries(mode, activeToken, droppedFiles, currentFolder.id);
>>>>>>> 4f904a9 (changes risky)
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
<<<<<<< HEAD
      await createFolder(mode, storageToken, trimmedName, currentFolder.id);
      recordActivity("Created folder", trimmedName);
=======
      await createFolder(mode, activeToken, trimmedName, currentFolder.id);
>>>>>>> 4f904a9 (changes risky)
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
<<<<<<< HEAD
      await deleteEntry(mode, storageToken, deleteTarget);
      recordActivity("Deleted", deleteTarget.name);
=======
      await deleteEntry(mode, activeToken, deleteTarget);
>>>>>>> 4f904a9 (changes risky)
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
<<<<<<< HEAD
      await downloadEntry(mode, storageToken, entry);
      recordActivity("Downloaded", entry.name);
=======
      await downloadEntry(mode, activeToken, entry);
>>>>>>> 4f904a9 (changes risky)
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

  function disconnectCurrentStorage() {
    setAccessToken("");
    setDfssToken("");
    clearDfssAuth();
    setProfile(null);
<<<<<<< HEAD
    setMode("backend");
=======
    setMode("local");
    setIsAuthenticated(false);
>>>>>>> 4f904a9 (changes risky)
    setLoading(true);
    setError("");
    setFolderPath([{ id: null, name: "Vault" }]);
    setActiveView("drive");
    setAuthOpen(true);
  }

  function selectView(view) {
    if (view === "recent") setRecentSince(Date.now() - 30 * 24 * 60 * 60 * 1000);
    setActiveView(view);
  }

<<<<<<< HEAD
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
=======
  if (!isAuthenticated) {
    return (
      <div className="drive-app">
        <AuthDialog
          intent={authIntent}
          busy={busy}
          error={authError}
          onConnectGoogle={handleGoogleConnect}
          onConnectDfss={handleDfssAuth}
          onUseLocal={useLocalWorkspace}
          onClose={() => setAuthOpen(false)}
        />
      </div>
    );
>>>>>>> 4f904a9 (changes risky)
  }

  return (
    <div className="drive-app">
<<<<<<< HEAD
      <DriveHeader search={search} onSearch={setSearch} profile={profile} account={authSession.user} onSignOut={signOut} onDisconnect={disconnectGoogle} onOpenAuth={openAuth} />
=======
      <DriveHeader search={search} onSearch={setSearch} profile={profile} onDisconnect={disconnectCurrentStorage} onOpenAuth={openAuth} />
>>>>>>> 4f904a9 (changes risky)
      <div className="workspace-layout">
        <DriveSidebar
          busy={busy}
          activeSection={activeSection}
          onUpload={() => uploadInput.current?.click()}
          onSelectSection={selectSection}
          folderSize={folderSize}
          fileCount={fileCount}
<<<<<<< HEAD
          isGoogle={isGoogle}
          isBackend={isBackend}
=======
          mode={mode}
>>>>>>> 4f904a9 (changes risky)
          onConnect={() => openAuth("signin")}
          onConnectDfss={() => setAuthOpen(true)}
          onDisconnect={disconnectCurrentStorage}
        />
        <input ref={uploadInput} className="visually-hidden" type="file" multiple onChange={handleUpload} />
<<<<<<< HEAD
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
=======
        <main className="file-main" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
          <section className="vault-banner">
            <div className="vault-intro-copy">
              <div className="vault-kicker"><span /> INDEPENDENT FILE STORAGE <i>/ TPCM—01</i></div>
              <h2>Your files,<br />on your terms.</h2>
              <p>A considered space for your digital archive. Organize files here or connect a storage account when you need it.</p>
              <div className="vault-status">
                <span className="status-led" />
                <div><small>ACTIVE STORAGE</small><strong>{isGoogle ? "CONNECTED DRIVE" : isDfss ? "DFSS COORDINATOR" : "PRIVATE TO THIS DEVICE"}</strong></div>
              </div>
            </div>
            <div className="vault-index" role="img" aria-label="TPCM Vault file index and storage layers">
              <div className="index-head"><span>FILE / 001</span><span>VAULT SYSTEM</span></div>
              <div className="index-mark"><img src="/tpcm-vault-mark.svg" alt="" /></div>
              <div className="index-lines"><span /><span /><span /></div>
              <div className="index-foot"><span>ARCHIVE INDEX</span><span>TP—CM / {isGoogle ? "REMOTE" : isDfss ? "DFSS" : "LOCAL"}</span></div>
            </div>
          </section>
          <div className="page-topline">
            <div><div className="eyebrow">ARCHIVE INDEX <span>·</span> {isGoogle ? "CONNECTED STORAGE" : isDfss ? "COORDINATOR STORAGE" : "PERSONAL STORAGE"}</div><h1>{activeView === "recent" ? "Recently added" : currentFolder.name === "Vault" ? "Vault contents" : currentFolder.name}</h1></div>
            <div className="main-actions">
              <button className="outline-action" type="button" onClick={() => { setFolderName(""); setFolderOpen(true); }} disabled={busy || isDfss}>New folder</button>
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
            isDfss={isDfss}
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

          {isDfss && (
            <div className="dfss-dashboard">
              <div className="dfss-overview">
                <div className="dfss-stat">
                  <span className="dfss-stat-label">Stored files</span>
                  <strong>{fileCount}</strong>
                </div>
                <div className="dfss-stat">
                  <span className="dfss-stat-label">Total size</span>
                  <strong>{formatBytes(folderSize)}</strong>
                </div>
                <div className="dfss-stat">
                  <span className="dfss-stat-label">Available nodes</span>
                  <strong>{dfssNodes.length}</strong>
                </div>
                <div className="dfss-stat">
                  <span className="dfss-stat-label">Storage health</span>
                  <strong>{storageHealth}</strong>
                </div>
              </div>

              <div className="dfss-panels">
                <section className="dfss-panel">
                  <div className="dfss-panel-header">
                    <h3>Storage-node status</h3>
                    <button type="button" className="dfss-refresh" onClick={refresh}>Refresh</button>
                  </div>
                  {dfssNodes.length ? (
                    <div className="dfss-node-list">
                      {dfssNodes.map((node) => (
                        <div key={node.id} className="dfss-node-row">
                          <div>
                            <strong>{node.id}</strong>
                            <span>{node.address}</span>
                          </div>
                          <span className={`dfss-node-status status-${node.status ?? "unknown"}`}>{node.status ?? "unknown"}</span>
                          <small>{node.lastHeartbeat ? new Date(node.lastHeartbeat).toLocaleString() : "Heartbeat unavailable"}</small>
                          <small>{formatBytes(Number(node.usedBytes || 0))} used / {formatBytes(Number(node.capacityBytes || 0))}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="dfss-empty">No storage-node data is currently available from the coordinator API.</p>
                  )}
                </section>

                <section className="dfss-panel">
                  <div className="dfss-panel-header">
                    <h3>File metadata</h3>
                  </div>
                  {entries.length ? (
                    <div className="dfss-file-metadata">
                      {entries.map((entry) => (
                        <div key={entry.id} className="dfss-file-row">
                          <div className="dfss-file-primary">
                            <strong>{entry.name}</strong>
                            <span>{entry.id}</span>
                          </div>
                          <div className="dfss-file-inline">
                            <span>Chunks: {entry.chunkCount ?? "n/a"}</span>
                            <span>Configured replication: {entry.replicationFactor ?? "n/a"}</span>
                          </div>
                          <div className="dfss-file-inline">
                            <span>Status: {entry.status ?? "unknown"}</span>
                            <span>SHA-256: {entry.sha256 ? `${entry.sha256.slice(0, 12)}…${entry.sha256.slice(-8)}` : "n/a"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="dfss-empty">Upload a file to see chunk, replication, and checksum metadata from the coordinator.</p>
                  )}
                </section>
              </div>
            </div>
>>>>>>> 4f904a9 (changes risky)
          )}
        </main>
      </div>
      {authOpen && <AuthDialog intent={authIntent} busy={busy} error={authError} onConnectGoogle={handleGoogleConnect} onConnectDfss={handleDfssAuth} onUseLocal={useLocalWorkspace} onClose={() => setAuthOpen(false)} />}
      {folderOpen && <FolderDialog name={folderName} busy={busy} onNameChange={setFolderName} onCreate={handleCreateFolder} onClose={() => setFolderOpen(false)} />}
      {deleteTarget && <DeleteDialog entry={deleteTarget} isGoogle={isGoogle} busy={busy} onDelete={handleDelete} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}

export default WorkspacePage;