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

export { FOLDER_MIME_TYPE };

export function listEntries(mode, token, parentId) {
  return mode === "local" ? listBrowserEntries(parentId) : listGoogleEntries(token, parentId);
}

export function uploadEntries(mode, token, files, parentId) {
  return mode === "local" ? uploadBrowserEntries(files, parentId) : uploadGoogleEntries(token, files, parentId);
}

export function createFolder(mode, token, name, parentId) {
  return mode === "local" ? createBrowserFolder(name, parentId) : createGoogleFolder(token, name, parentId);
}

export function deleteEntry(mode, token, entry) {
  return mode === "local" ? deleteBrowserEntry(entry) : deleteGoogleEntry(token, entry);
}

export async function downloadEntry(mode, token, entry) {
  if (mode === "local") {
    const blob = await downloadBrowserEntry(entry);
    if (!blob) throw new Error("This file could not be opened.");
    downloadBlob(blob, entry.name);
    return;
  }

  await downloadGoogleEntry(token, entry);
}