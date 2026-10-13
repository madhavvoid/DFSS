let googleScriptPromise;

function loadGoogleIdentityServices() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const timeout = window.setTimeout(() => reject(new Error("Google sign-in did not load. Check your connection and try again.")), 10000);
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => {
        window.clearTimeout(timeout);
        resolve();
      };
      script.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error("Google sign-in did not load. Check your connection and try again."));
      };
      document.head.append(script);
    }).catch((error) => {
      googleScriptPromise = undefined;
      throw error;
    });
  }
  return googleScriptPromise;
}

export async function connectGoogleAccount(clientId, intent) {
  await loadGoogleIdentityServices();
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile https://www.googleapis.com/auth/drive.file",
      callback: async (response) => {
        if (response.error) {
          reject(new Error(response.error_description || "Google sign-in was not completed."));
          return;
        }
        try {
          const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${response.access_token}` },
          });
          if (!profileResponse.ok) throw new Error("Could not read the Google account profile.");
          resolve({ token: response.access_token, profile: await profileResponse.json() });
        } catch (error) {
          reject(error);
        }
      },
      error_callback: (error) => reject(new Error(error.message || "Google sign-in was not completed.")),
    });
    tokenClient.requestAccessToken({ prompt: intent === "signup" ? "consent" : "select_account" });
  });
}