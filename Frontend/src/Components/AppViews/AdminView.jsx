import { useEffect, useState } from "react";
import { downloadAdminUpload, listAdminRecords } from "../../services/adminService";
import { formatBytes, formatDate } from "../../utils/fileUtils";

const PAGE_SIZE = 25;

function AdminView({ token }) {
  const [recordType, setRecordType] = useState("users");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ users: [], files: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [downloadingId, setDownloadingId] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    listAdminRecords(token, recordType, { page, search, signal: controller.signal })
      .then((data) => {
        setResult(data);
        setError("");
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message || "Could not load administrator records.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, recordType, page, search, refreshKey]);

  const records = recordType === "users" ? result.users : result.files;
  const pageCount = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  function changeType(type) {
    setLoading(true);
    setRecordType(type);
    setPage(1);
    setSearch("");
  }

  function updateSearch(value) {
    setLoading(true);
    setSearch(value);
    setPage(1);
  }

  async function handleDownload(file) {
    setDownloadingId(file.id);
    setError("");
    try {
      await downloadAdminUpload(token, file);
    } catch (downloadError) {
      setError(downloadError.message || "Could not download this file.");
    } finally {
      setDownloadingId("");
    }
  }

  return (
    <section className="app-view admin-view">
      <div className="view-heading">
        <div><span className="view-kicker">SYSTEM OVERSIGHT</span><h1>Admin console</h1><p>Registered accounts and files stored across the system.</p></div>
        <button className="outline-action" type="button" aria-label="Refresh records" title="Refresh records" disabled={loading} onClick={() => { setLoading(true); setRefreshKey((value) => value + 1); }}>↻</button>
      </div>
      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist" aria-label="Administrator records">
          <button type="button" role="tab" aria-selected={recordType === "users"} className={recordType === "users" ? "selected" : ""} onClick={() => changeType("users")}>Users</button>
          <button type="button" role="tab" aria-selected={recordType === "uploads"} className={recordType === "uploads" ? "selected" : ""} onClick={() => changeType("uploads")}>Uploads</button>
        </div>
        <label className="admin-search">
          <span aria-hidden="true">⌕</span>
          <input type="search" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder={recordType === "users" ? "Search name, email or phone" : "Search file names"} aria-label={recordType === "users" ? "Search users" : "Search uploads"} />
        </label>
      </div>
      {error && <div className="nodes-message nodes-error" role="alert">{error}</div>}
      {loading ? <div className="nodes-message">Loading administrator records…</div> : error ? null : records.length ? (
        <>
          <div className="nodes-table-wrap admin-table-wrap">
            {recordType === "users" ? (
              <table className="nodes-table admin-table"><thead><tr><th>ACCOUNT</th><th>CONTACT</th><th>REGISTERED</th><th>LAST SIGN-IN</th></tr></thead><tbody>
                {result.users.map((user) => <tr key={user.id}><td><strong>{user.name}</strong><small>{user.id}</small></td><td>{user.email || user.phone || "—"}</td><td>{formatDate(user.createdAt)}</td><td>{formatDate(user.lastLoginAt)}</td></tr>)}
              </tbody></table>
            ) : (
              <table className="nodes-table admin-table"><thead><tr><th>FILE</th><th>OWNER</th><th>SIZE</th><th>STATUS</th><th>UPLOADED</th><th>ACTION</th></tr></thead><tbody>
                {result.files.map((file) => <tr key={file.id}><td><strong>{file.name}</strong><small>{file.chunkCount} chunks · {file.replicationFactor} replicas</small></td><td>{file.owner?.name || file.owner?.email || "Account removed"}<small>{file.owner?.email || ""}</small></td><td>{formatBytes(file.size)}</td><td><span className={`node-status ${file.status === "complete" ? "node-online" : "node-offline"}`}>{file.status}</span></td><td>{formatDate(file.createdAt)}</td><td><button className="admin-download-action" type="button" title={`Download ${file.name}`} aria-label={`Download ${file.name}`} disabled={file.status !== "complete" || downloadingId === file.id} onClick={() => handleDownload(file)}>{downloadingId === file.id ? "…" : "↓"}</button></td></tr>)}
              </tbody></table>
            )}
          </div>
          <div className="admin-pagination"><span>{result.total} {recordType === "users" ? "accounts" : "uploads"}</span><div><button className="outline-action" type="button" disabled={page <= 1} onClick={() => { setLoading(true); setPage((value) => value - 1); }}>Previous</button><span>Page {page} of {pageCount}</span><button className="outline-action" type="button" disabled={page >= pageCount} onClick={() => { setLoading(true); setPage((value) => value + 1); }}>Next</button></div></div>
        </>
      ) : <div className="nodes-message">{search ? "No matching records." : `No ${recordType === "users" ? "accounts" : "uploads"} yet.`}</div>}
    </section>
  );
}

export default AdminView;