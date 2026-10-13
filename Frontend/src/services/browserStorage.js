import { FOLDER_MIME_TYPE } from "../utils/fileUtils";

const DATABASE_NAME = "dfss-browser-drive";
const DATABASE_VERSION = 1;
const STORE_NAME = "entries";

let databaseRequest;

function openDatabase() {
  if (!databaseRequest) {
    databaseRequest = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return databaseRequest;
}

function requestValue(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listBrowserEntries(parentId) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const entries = await requestValue(transaction.objectStore(STORE_NAME).getAll());
  return entries.filter((entry) => entry.parentId === parentId);
}

export async function uploadBrowserEntries(files, parentId) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  await Promise.all(files.map((file) => requestValue(store.put({
    id: crypto.randomUUID(),
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    modifiedTime: new Date(file.lastModified || Date.now()).toISOString(),
    parentId,
    blob: file,
  }))));
}

export async function createBrowserFolder(name, parentId) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  await requestValue(transaction.objectStore(STORE_NAME).put({
    id: crypto.randomUUID(),
    name,
    mimeType: FOLDER_MIME_TYPE,
    size: 0,
    modifiedTime: new Date().toISOString(),
    parentId,
  }));
}

export async function deleteBrowserEntry(entry) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  await requestValue(transaction.objectStore(STORE_NAME).delete(entry.id));
}

export async function downloadBrowserEntry(entry) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const storedEntry = await requestValue(transaction.objectStore(STORE_NAME).get(entry.id));
  return storedEntry?.blob;
}