function DriveHeader({ search, onSearch, profile, onDisconnect, onOpenAuth }) {
  return (
    <header className="app-header">
      <a className="app-brand" href="#my-drive" aria-label="TPCM Vault home">
        <img className="brand-mark" src="/tpcm-vault-mark.svg" alt="" />
        <span className="brand-wordmark"><strong>TPCM</strong><small>VAULT</small></span>
      </a>
      <label className="global-search">
        <span aria-hidden="true">⌕</span>
        <input aria-label="Search files in this folder" placeholder="Search your vault" value={search} onChange={(event) => onSearch(event.target.value)} />
      </label>
      <div className="header-account">
        {profile ? (
          <>
            <span className="account-email">{profile.email}</span>
            <button className="account-avatar" type="button" title="Use browser storage" onClick={onDisconnect}>
              {profile.picture ? <img src={profile.picture} alt="" /> : (profile.name || profile.email || "G").slice(0, 1).toUpperCase()}
            </button>
          </>
        ) : (
          <>
            <button className="header-login" type="button" onClick={() => onOpenAuth("signin")}>Log in</button>
            <button className="header-signup" type="button" onClick={() => onOpenAuth("signup")}>Sign up <span aria-hidden="true">↗</span></button>
          </>
        )}
      </div>
    </header>
  );
}

export default DriveHeader;