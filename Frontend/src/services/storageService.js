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
import {
  deleteDfssFile,
  downloadDfssFile,
  listDfssFiles,
  uploadDfssFile,
} from "./dfssApi";
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
  if (mode === "local") return listBrowserEntries(parentId);
  if (mode === "google") return listGoogleEntries(token, parentId);
  if (mode === "dfss" || mode === "backend") return listDfssFiles(token);
  throw new Error("Unsupported storage mode.");
}

export async function uploadEntries(mode, token, files, parentId) {
  if (mode === "local") return uploadBrowserEntries(files, parentId);
  if (mode === "google") return uploadGoogleEntries(token, files, parentId);
  if (mode === "dfss" || mode === "backend") {
    if (!files || files.length === 0) throw new Error("Choose a file to upload.");
    if (files.length > 1) throw new Error("DFSS uploads are limited to one file at a time.");
    return uploadDfssFile(token, files[0]);
  }
  throw new Error("Unsupported storage mode.");
}

export function createFolder(mode, token, name, parentId) {
  if (mode === "local") return createBrowserFolder(name, parentId);
  if (mode === "google") return createGoogleFolder(token, name, parentId);
  if (mode === "dfss" || mode === "backend") {
    throw new Error("The DFSS coordinator does not support virtual folders in the frontend.");
  }
  throw new Error("Unsupported storage mode.");
}

export function deleteEntry(mode, token, entry) {
  if (mode === "local") return deleteBrowserEntry(entry);
  if (mode === "google") return deleteGoogleEntry(token, entry);
  if (mode === "dfss" || mode === "backend") return deleteDfssFile(token, entry.id ?? entry._id);
  throw new Error("Unsupported storage mode.");
}

export async function downloadEntry(mode, token, entry) {
  if (mode === "local") {
    const blob = await downloadBrowserEntry(entry);
    if (!blob) throw new Error("This file could not be opened.");
    downloadBlob(blob, entry.name);
    return;
  }

  if (mode === "google") {
    await downloadGoogleEntry(token, entry);
    return;
  }

  if (mode === "dfss" || mode === "backend") {
    await downloadDfssFile(token, entry);
    return;
  }

  throw new Error("Unsupported storage mode.");
}