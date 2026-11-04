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

export { FOLDER_MIME_TYPE };

export function listEntries(mode, token, parentId) {
  if (mode === "local") return listBrowserEntries(parentId);
  if (mode === "google") return listGoogleEntries(token, parentId);
  if (mode === "dfss") return listDfssFiles(token);
  throw new Error("Unsupported storage mode.");
}

export async function uploadEntries(mode, token, files, parentId) {
  if (mode === "local") return uploadBrowserEntries(files, parentId);
  if (mode === "google") return uploadGoogleEntries(token, files, parentId);
  if (mode === "dfss") {
    if (!files || files.length === 0) throw new Error("Choose a file to upload.");
    if (files.length > 1) throw new Error("DFSS uploads are limited to one file at a time.");
    return uploadDfssFile(token, files[0]);
  }
  throw new Error("Unsupported storage mode.");
}

export function createFolder(mode, token, name, parentId) {
  if (mode === "local") return createBrowserFolder(name, parentId);
  if (mode === "google") return createGoogleFolder(token, name, parentId);
  if (mode === "dfss") {
    throw new Error("The DFSS coordinator does not support virtual folders in the frontend.");
  }
  throw new Error("Unsupported storage mode.");
}

export function deleteEntry(mode, token, entry) {
  if (mode === "local") return deleteBrowserEntry(entry);
  if (mode === "google") return deleteGoogleEntry(token, entry);
  if (mode === "dfss") return deleteDfssFile(token, entry.id ?? entry._id);
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

  if (mode === "dfss") {
    await downloadDfssFile(token, entry);
    return;
  }

  throw new Error("Unsupported storage mode.");
}