function AuthDialog({ intent, busy, error, onConnectGoogle, onUseLocal, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="dialog-close" type="button" aria-label="Close" onClick={onClose}>×</button>
        <span className="dialog-kicker">TPCM / ACCOUNT</span>
        <h2 id="auth-title">{intent === "signup" ? "Make room for your files." : "Your files, in reach."}</h2>
        <p>Use your Google account to connect TPCM to Google Drive. Your files stay in your Drive.</p>
        <button className="google-action" type="button" onClick={onConnectGoogle} disabled={busy}><span className="google-g">G</span>{busy ? "Connecting…" : "Continue with Google"}<span className="google-arrow">↗</span></button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="dialog-rule"><span>OR</span></div>
        <button className="local-action" type="button" onClick={onUseLocal}>Continue with browser storage</button>
        <small>Browser storage is saved on this device only. Google Drive access requires the project owner’s OAuth configuration.</small>
      </section>
    </div>
  );
}

export default AuthDialog;