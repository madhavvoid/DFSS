const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function postAuth(path, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(`TPCM cannot reach the authentication server at ${API_BASE_URL}. Start the DFSS backend and try again.`);
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Authentication could not be completed.");
  return result;
}

export function requestEmailCode(details) {
  return postAuth("request-code", details);
}

export function verifyEmailCode(details) {
  return postAuth("verify-code", details);
}