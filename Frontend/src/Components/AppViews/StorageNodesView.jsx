import { useEffect, useState } from "react";
import { formatBytes, formatDate } from "../../utils/fileUtils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function StorageNodesView({ token }) {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/nodes`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Could not load storage nodes.");
        return result.nodes || [];
      })
      .then(setNodes)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message || "Could not load storage nodes.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, refreshKey]);

  return (
    <section className="app-view nodes-view">
      <div className="view-heading">
        <div><span className="view-kicker">DISTRIBUTED STORAGE</span><h1>Storage nodes</h1><p>Current availability and capacity across registered nodes.</p></div>
        <button className="outline-action" type="button" onClick={() => { setLoading(true); setError(""); setRefreshKey((value) => value + 1); }} disabled={loading}>Refresh</button>
      </div>
      {error && <div className="nodes-message nodes-error" role="alert">{error}</div>}
      {loading ? <div className="nodes-message">Checking storage nodes…</div> : error ? null : nodes.length ? (
        <div className="nodes-table-wrap"><table className="nodes-table"><thead><tr><th>NODE</th><th>STATUS</th><th>ZONE</th><th>CAPACITY</th><th>LAST HEARTBEAT</th></tr></thead><tbody>{nodes.map((node) => <tr key={node.id}><td><strong>{node.id}</strong><small>{node.address}</small></td><td><span className={`node-status node-${node.status}`}>{node.status}</span></td><td>{node.zone}</td><td>{formatBytes(node.usedBytes)} / {formatBytes(node.capacityBytes)}</td><td>{formatDate(node.lastHeartbeat)}</td></tr>)}</tbody></table></div>
      ) : <div className="nodes-message">No storage nodes are registered yet.</div>}
    </section>
  );
}

export default StorageNodesView;