function SettingsView({ user, isGoogle, isBackend, onConnect, onDisconnect, onSignOut }) {
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
      <section className="settings-section settings-signout"><div><h2>Sign out</h2><p>End this session and return to the welcome page.</p></div><button className="outline-action" type="button" onClick={onSignOut}>Sign out</button></section>
    </section>
  );
}

export default SettingsView;