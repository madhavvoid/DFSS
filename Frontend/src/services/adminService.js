const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
import { downloadBlob } from "../utils/fileUtils";

export async function listAdminRecords(token, type, { page = 1, search = "", signal } = {}) {
  const query = new URLSearchParams({ page: String(page), limit: "25" });
  if (search.trim()) query.set("q", search.trim());
  const response = await fetch(`${API_BASE_URL}/api/admin/${type}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Could not load administrator records.");
  return result;
}

export async function downloadAdminUpload(token, file) {
  const response = await fetch(`${API_BASE_URL}/api/admin/uploads/${encodeURIComponent(file.id)}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "Could not download this file.");
  }
  downloadBlob(await response.blob(), file.name);
}