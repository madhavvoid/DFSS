import { useState } from "react";

function AuthDialog({ intent, busy, error, onConnectGoogle, onConnectDfss, onUseLocal, onClose }) {
  const [dfssMode, setDfssMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="dialog-close" type="button" aria-label="Close" onClick={onClose}>×</button>
        <span className="dialog-kicker">TPCM VAULT / ACCOUNT</span>
        <h2 id="auth-title">{intent === "signup" ? "Make room for your files." : "Your files, in reach."}</h2>
        <p>Choose how you want to store the archive. Google Drive uses your personal Google account; DFSS uses the coordinator API and distributed storage nodes.</p>

        <button className="google-action" type="button" onClick={onConnectGoogle} disabled={busy}><span className="google-g">G</span>{busy ? "Connecting…" : "Continue with Google"}<span className="google-arrow">↗</span></button>

        <div className="dfss-auth-panel">
          <div className="dfss-toggle" aria-label="DFSS account mode">
            <button type="button" className={dfssMode === "signin" ? "selected" : ""} onClick={() => setDfssMode("signin")}>Log in</button>
            <button type="button" className={dfssMode === "signup" ? "selected" : ""} onClick={() => setDfssMode("signup")}>Sign up</button>
          </div>

          {dfssMode === "signup" && (
            <label className="dfss-field">
              <span>Full name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} type="text" placeholder="Alex Morgan" autoComplete="name" />
            </label>
          )}

          <label className="dfss-field">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="user@example.com" autoComplete="email" />
          </label>

          <label className="dfss-field">
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="••••••••" autoComplete={dfssMode === "signup" ? "new-password" : "current-password"} />
          </label>

          <button className="local-action dfss-submit" type="button" disabled={busy} onClick={() => onConnectDfss({ mode: dfssMode, name, email, password })}>
            {busy ? "Connecting…" : (dfssMode === "signup" ? "Create DFSS account" : "Log in to DFSS")}
          </button>
        </div>

        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="dialog-rule"><span>OR</span></div>
        <button className="local-action" type="button" onClick={onUseLocal}>Continue with browser storage</button>
        <small>Browser storage stays on this device only. Google Drive access requires a valid OAuth setup. DFSS requests are sent to the configured coordinator backend.</small>
      </section>
    </div>
  );
}

export default AuthDialog;