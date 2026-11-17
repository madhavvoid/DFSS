import { useState } from "react";
import { setPassword as savePassword } from "../../services/authService";

function SettingsView({ user, token, isGoogle, isBackend, onConnect, onDisconnect, onSignOut, onUserUpdated }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordError("");
    setPasswordNotice("");
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordBusy(true);
    try {
      const result = await savePassword(token, {
        password,
        ...(user.hasPassword ? { currentPassword } : {}),
      });
      onUserUpdated(result.user);
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setPasswordNotice("Password updated.");
    } catch (requestError) {
      setPasswordError(requestError.message || "Could not update the password.");
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <section className="app-view settings-view">
      <div className="view-heading"><div><span className="view-kicker">ACCOUNT PREFERENCES</span><h1>Settings</h1><p>Manage your profile and connected storage.</p></div></div>
      <section className="settings-section">
        <div className="settings-section-heading"><span className="view-kicker">PROFILE</span><h2>Account details</h2></div>
        <dl className="settings-details"><div><dt>Name</dt><dd>{user.name || "Not provided"}</dd></div><div><dt>Email</dt><dd>{user.email || "Not provided"}</dd></div><div><dt>Phone</dt><dd>{user.phone || "Not provided"}</dd></div></dl>
      </section>
      <section className="settings-section">
        <div className="settings-section-heading"><span className="view-kicker">FILE LOCATION</span><h2>Storage provider</h2></div>
        <div className="settings-provider"><span className="provider-dot" /><div><strong>{isBackend ? "TPCM distributed storage" : isGoogle ? "Google Drive" : "This device"}</strong><small>{isBackend ? "Files are chunked and replicated across registered storage nodes." : isGoogle ? "Files are stored in your connected Drive account." : "Files are stored in this browser on this device."}</small></div>{isGoogle ? <button className="outline-action" type="button" onClick={onDisconnect}>Use TPCM storage</button> : <button className="outline-action" type="button" onClick={onConnect}>Connect Google Drive</button>}</div>
      </section>
      <section className="settings-section">
        <div className="settings-section-heading"><span className="view-kicker">ACCOUNT SECURITY</span><h2>{user.hasPassword ? "Change password" : "Set a password"}</h2></div>
        <form className="password-settings-form" onSubmit={handlePasswordSubmit}>
          {user.hasPassword && <><label htmlFor="settings-current-password">Current password</label><input id="settings-current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></>}
          <label htmlFor="settings-new-password">New password</label>
          <input id="settings-new-password" type="password" autoComplete="new-password" minLength="8" maxLength="72" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <label htmlFor="settings-confirm-password">Confirm new password</label>
          <input id="settings-confirm-password" type="password" autoComplete="new-password" minLength="8" maxLength="72" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          {passwordError && <p className="auth-page-error" role="alert">{passwordError}</p>}
          {passwordNotice && <p className="password-success" role="status">{passwordNotice}</p>}
          <button className="solid-action" type="submit" disabled={passwordBusy}>{passwordBusy ? "Saving…" : user.hasPassword ? "Update password" : "Set password"}</button>
        </form>
      </section>
      <section className="settings-section settings-signout"><div><h2>Sign out</h2><p>End this session and return to the welcome page.</p></div><button className="outline-action" type="button" onClick={onSignOut}>Sign out</button></section>
    </section>
  );
}

export default SettingsView;