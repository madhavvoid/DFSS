import {
  createBrowserFolder,
  deleteBrowserEntry,
  downloadBrowserEntry,
  listBrowserEntries,
  uploadBrowserEntries,
} from "./browserStorage";
import {
  createGoogleFolder,
  deleteGoogleEntry,
  downloadGoogleEntry,
  listGoogleEntries,
  uploadGoogleEntries,
} from "./googleDrive";
import { downloadBlob, FOLDER_MIME_TYPE } from "../utils/fileUtils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export { FOLDER_MIME_TYPE };

async function requestBackend(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/files${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "The distributed storage service could not complete the request.");
  }
  return response;
}

function mapBackendFile(file) {
  return {
    id: file.id,
    name: file.name,
    size: file.size,
    mimeType: "application/octet-stream",
    modifiedTime: file.createdAt,
    status: file.status,
    sha256: file.sha256,
    chunkCount: file.chunkCount,
    replicationFactor: file.replicationFactor,
  };
}

export function listEntries(mode, token, parentId) {
  if (mode === "backend") {
    return requestBackend("?limit=100&page=1", token)
      .then((response) => response.json())
      .then(async (firstPage) => {
        const pageCount = Math.ceil(firstPage.total / firstPage.limit);
        const remainingPages = await Promise.all(Array.from({ length: pageCount - 1 }, (_, index) => (
          requestBackend(`?limit=100&page=${index + 2}`, token).then((response) => response.json())
        )));
        return [firstPage, ...remainingPages].flatMap((page) => page.files.map(mapBackendFile));
      });
  }
  return mode === "local" ? listBrowserEntries(parentId) : listGoogleEntries(token, parentId);
}

export async function uploadEntries(mode, token, files, parentId) {
  if (mode === "backend") {
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      await requestBackend("/upload", token, { method: "POST", body: formData });
    }
    return;
  }
  return mode === "local" ? uploadBrowserEntries(files, parentId) : uploadGoogleEntries(token, files, parentId);
}

export function createFolder(mode, token, name, parentId) {
  if (mode === "backend") return Promise.reject(new Error("Folders are not available in distributed storage yet."));
  return mode === "local" ? createBrowserFolder(name, parentId) : createGoogleFolder(token, name, parentId);
}

export function deleteEntry(mode, token, entry) {
  if (mode === "backend") return requestBackend(`/${encodeURIComponent(entry.id)}`, token, { method: "DELETE" });
  return mode === "local" ? deleteBrowserEntry(entry) : deleteGoogleEntry(token, entry);
}

export async function downloadEntry(mode, token, entry) {
  if (mode === "local") {
    const blob = await downloadBrowserEntry(entry);
    if (!blob) throw new Error("This file could not be opened.");
    downloadBlob(blob, entry.name);
    return;
  }

  if (mode === "backend") {
    const response = await requestBackend(`/${encodeURIComponent(entry.id)}/download`, token);
    const blob = await response.blob();
    downloadBlob(blob, entry.name);
    return;
  }

  await downloadGoogleEntry(token, entry);
}