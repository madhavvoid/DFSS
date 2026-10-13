import { downloadBlob } from "../utils/fileUtils";

async function googleRequest(token, path, options = {}) {
  const url = path.startsWith("https://") ? path : `https://www.googleapis.com/drive/v3/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let detail = "Google Drive request failed.";
    try {
      const payload = await response.json();
      detail = payload.error?.message || detail;
    } catch {
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }

  return response;
}

export async function listGoogleEntries(token, parentId) {
  const files = [];
  let pageToken;

  do {
    const parameters = new URLSearchParams({
      q: `'${parentId || "root"}' in parents and trashed = false`,
      pageSize: "1000",
      orderBy: "folder,name",
      fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime,parents,webViewLink)",
    });
    if (pageToken) parameters.set("pageToken", pageToken);

    const response = await googleRequest(token, `files?${parameters.toString()}`);
    const payload = await response.json();
    files.push(...(payload.files || []));
    pageToken = payload.nextPageToken;
  } while (pageToken);

  return files;
}

export async function uploadGoogleEntries(token, files, parentId) {
  for (const file of files) {
    const boundary = `tpcm_vault_${crypto.randomUUID()}`;
    const metadata = JSON.stringify({ name: file.name, parents: [parentId || "root"] });
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
      `--${boundary}\r\nContent-Type: ${file.type || "application/octet-stream"}\r\n\r\n`,
      file,
      `\r\n--${boundary}--`,
    ], { type: `multipart/related; boundary=${boundary}` });

    await googleRequest(token, "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
  }
}

export async function createGoogleFolder(token, name, parentId) {
  await googleRequest(token, "files?fields=id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [parentId || "root"] }),
  });
}

export async function deleteGoogleEntry(token, entry) {
  await googleRequest(token, `files/${encodeURIComponent(entry.id)}`, { method: "DELETE" });
}

export async function downloadGoogleEntry(token, entry) {
  const response = await googleRequest(token, `files/${encodeURIComponent(entry.id)}?alt=media`);
  downloadBlob(await response.blob(), entry.name);
}