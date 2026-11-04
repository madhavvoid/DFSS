const STORAGE_KEY = "dfss-auth-token";
const USER_KEY = "dfss-auth-user";
const DEFAULT_API_URL = import.meta.env.PROD ? window.location.origin : "http://localhost:4000";

export function getDfssApiBaseUrl() {
  const configured = (import.meta.env.VITE_DFSS_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
  return configured || DEFAULT_API_URL;
}

export function readDfssAuth() {
  if (typeof window === "undefined") {
    return { token: "", user: null };
  }

  try {
    const token = window.localStorage.getItem(STORAGE_KEY) ?? "";
    const user = window.localStorage.getItem(USER_KEY);
    return {
      token,
      user: user ? JSON.parse(user) : null,
    };
  } catch {
    return { token: "", user: null };
  }
}

export function persistDfssAuth(token, user) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(STORAGE_KEY, token);
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function clearDfssAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function extractErrorMessage(payload, fallback = "The DFSS service is unavailable.") {
  if (payload && typeof payload === "object") {
    if (typeof payload.error === "string" && payload.error.trim()) return payload.error;
    if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
  }
  return fallback;
}

export function parseContentDispositionFilename(value) {
  if (!value) return "";
  const match = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(value) || /filename="?([^";]+)"?/i.exec(value);
  if (!match) return "";
  const raw = decodeURIComponent(match[1].replace(/['"]/g, ""));
  return raw || "";
}

export function normalizeDfssFile(file) {
  const record = file ?? {};
  return {
    id: record.id ?? record._id ?? "",
    name: record.name ?? record.originalName ?? "Unnamed file",
    size: Number(record.size ?? 0),
    mimeType: record.mimeType ?? "application/octet-stream",
    modifiedTime: record.createdAt ?? record.updatedAt ?? new Date().toISOString(),
    parentId: null,
    dfss: record,
    chunkSize: Number(record.chunkSize ?? 0),
    chunkCount: Number(record.chunkCount ?? 0),
    sha256: record.sha256 ?? "",
    replicationFactor: Number(record.replicationFactor ?? 0),
    status: record.status ?? "unknown",
  };
}

async function requestDfss({ path, method = "GET", token, body, headers = {}, responseType = "json" }) {
  let payload;
  const requestHeaders = { ...headers };
  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  const init = {
    method,
    headers: requestHeaders,
    credentials: "omit",
  };

  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = requestHeaders["Content-Type"] ?? "application/json";
    init.body = JSON.stringify(body);
  }
  if (body instanceof FormData) {
    init.body = body;
  }

  const response = await fetch(`${getDfssApiBaseUrl()}${path}`, init);

  if (responseType === "blob") {
    payload = await response.blob();
  } else if (response.headers.get("content-type")?.includes("application/json")) {
    const text = await response.text();
    payload = text ? JSON.parse(text) : {};
  } else {
    const text = await response.text();
    payload = text ? text : {};
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, `DFSS request failed with status ${response.status}`));
  }

  return { response, payload };
}

export async function loginDfssAccount(email, password) {
  const { payload } = await requestDfss({
    path: "/api/auth/login",
    method: "POST",
    body: { email, password },
  });
  if (!payload?.token || !payload?.user) {
    throw new Error("The DFSS backend did not return a valid session.");
  }
  persistDfssAuth(payload.token, payload.user);
  return payload;
}

export async function registerDfssAccount(name, email, password) {
  const { payload } = await requestDfss({
    path: "/api/auth/register",
    method: "POST",
    body: { name, email, password },
  });
  if (!payload?.token || !payload?.user) {
    throw new Error("The DFSS backend did not return a valid account.");
  }
  persistDfssAuth(payload.token, payload.user);
  return payload;
}

export async function fetchDfssCurrentUser(token) {
  const { payload } = await requestDfss({ path: "/api/auth/me", token });
  if (!payload?.user) {
    throw new Error("The DFSS session did not return a valid user record.");
  }
  persistDfssAuth(token, payload.user);
  return payload.user;
}

export async function listDfssFiles(token) {
  const { payload } = await requestDfss({ path: "/api/files", token });
  const files = Array.isArray(payload?.files) ? payload.files : [];
  return files.map(normalizeDfssFile);
}

export async function uploadDfssFile(token, file) {
  if (!file) throw new Error("Choose a file to upload.");
  if (file instanceof FileList || Array.isArray(file)) {
    throw new Error("DFSS uploads are limited to one file at a time.");
  }

  const formData = new FormData();
  formData.append("file", file, file.name);

  const { payload } = await requestDfss({
    path: "/api/files/upload",
    method: "POST",
    token,
    body: formData,
  });

  if (!payload?.file) {
    throw new Error("The DFSS coordinator did not accept the uploaded file.");
  }

  return normalizeDfssFile(payload.file);
}

export async function getDfssFileDetails(token, fileId) {
  const { payload } = await requestDfss({ path: `/api/files/${encodeURIComponent(fileId)}`, token });
  if (!payload?.file) {
    throw new Error("The DFSS coordinator did not return file metadata.");
  }
  return payload;
}

export async function getDfssFileStatus(token, fileId) {
  const { payload } = await requestDfss({ path: `/api/files/${encodeURIComponent(fileId)}/status`, token });
  if (!payload) {
    throw new Error("The DFSS coordinator did not return file status metadata.");
  }
  return payload;
}

export async function downloadDfssFile(token, file) {
  const fileId = file?.id ?? file?._id;
  if (!fileId) throw new Error("This file is missing a valid DFSS ID.");

  const { response, payload } = await requestDfss({
    path: `/api/files/${encodeURIComponent(fileId)}/download`,
    method: "GET",
    token,
    responseType: "blob",
  });

  const blob = payload instanceof Blob ? payload : new Blob([payload ?? ""]);
  const headerValue = response.headers.get("Content-Disposition") ?? "";
  const fileName = parseContentDispositionFilename(headerValue) || file?.name || "download.bin";

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return { fileName, blob };
}

export async function deleteDfssFile(token, fileId) {
  const response = await fetch(`${getDfssApiBaseUrl()}/api/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "omit",
  });

  if (!response.ok && response.status !== 204) {
    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};
    throw new Error(extractErrorMessage(payload, `Delete failed with status ${response.status}`));
  }

  return true;
}

export async function listDfssNodes(token) {
  const { payload } = await requestDfss({ path: "/api/nodes", token });
  const nodes = Array.isArray(payload?.nodes) ? payload.nodes : [];
  return nodes.map((node) => ({
    id: node.id ?? node._id ?? "unknown",
    address: node.address ?? "unknown",
    capacityBytes: Number(node.capacityBytes ?? 0),
    usedBytes: Number(node.usedBytes ?? 0),
    zone: node.zone ?? "default",
    status: node.status ?? "unknown",
    lastHeartbeat: node.lastHeartbeat ?? null,
  }));
}
