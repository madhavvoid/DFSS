import { useState } from "react";
import { login, register } from "../../services/authService";
import "./AuthPage.css";

function AuthPage({ onAuthenticated, onBack, onOtherStorage, initialIntent = "signin" }) {
  const [intent, setIntent] = useState(initialIntent);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function changeIntent(nextIntent) {
    setIntent(nextIntent);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = intent === "signup"
        ? await register({ name, email, phone, password })
        : await login({ email, password });
      onAuthenticated(session);
    } catch (authError) {
      setError(authError.message || "Authentication could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-page-header">
        <a className="auth-page-brand" href="#auth" aria-label="TPCM">
          <img src="/tpcm-vault-mark.svg" alt="" />
          <span><strong>TPCM</strong><small>Distributed File Storage System</small></span>
        </a>
        <div className="auth-header-actions">
          <span className="auth-header-note">PERSONAL FILE SPACE <i /> PRIVATE BY DEFAULT</span>
          <button className="auth-back-home" type="button" onClick={onBack}>Back to home</button>
        </div>
      </header>
      <section className="auth-stage" aria-labelledby="auth-page-title">
        <div className="auth-story">
          <span className="auth-kicker">TPCM <b>/ ACCOUNT ACCESS</b></span>
          <h1 id="auth-page-title">A little more<br />space for <em>you.</em></h1>
          <p>Your files deserve a place that feels like yours. Sign in or create your account to continue.</p>
          <div className="auth-story-foot"><span>01</span><span>YOUR DIGITAL ARCHIVE STARTS HERE</span></div>
        </div>

        <section className="auth-panel" aria-label={intent === "signup" ? "Create an account" : "Sign in"}>
          <div className="auth-panel-heading">
            <div>
              <span className="auth-panel-kicker">WELCOME TO TPCM</span>
              <h2>{intent === "signup" ? "Create your account" : "Welcome back"}</h2>
            </div>
          </div>
          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button type="button" role="tab" aria-selected={intent === "signin"} className={intent === "signin" ? "selected" : ""} onClick={() => changeIntent("signin")}>Sign in</button>
            <button type="button" role="tab" aria-selected={intent === "signup"} className={intent === "signup" ? "selected" : ""} onClick={() => changeIntent("signup")}>Sign up</button>
          </div>
          <p className="auth-panel-copy">{intent === "signup" ? "Create an account with your email and a password." : "Sign in with the email and password on your account."}</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            {intent === "signup" && (
              <>
                <label htmlFor="auth-name">Full name</label>
                <input id="auth-name" autoComplete="name" maxLength="100" value={name} onChange={(event) => setName(event.target.value)} required />
              </>
            )}
            <label htmlFor="auth-email">Email address</label>
            <input id="auth-email" type="email" autoComplete="email" maxLength="254" value={email} onChange={(event) => setEmail(event.target.value)} required />
            {intent === "signup" && (
              <label htmlFor="auth-phone">Phone number (optional)</label>
            )}
            {intent === "signup" && (
              <input id="auth-phone" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            )}
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              autoComplete={intent === "signup" ? "new-password" : "current-password"}
              minLength="8"
              maxLength="72"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {intent === "signup" && <small className="auth-privacy-note">Use at least 8 characters. Your password is stored securely as a hash.</small>}
            {error && <p className="auth-page-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? "Please wait…" : intent === "signup" ? "Create account" : "Sign in"}
              <span aria-hidden="true">↗</span>
            </button>
          </form>
          <button className="auth-other-storage" type="button" onClick={onOtherStorage}>Use Google Drive or browser storage</button>
        </section>
      </section>
      <footer className="auth-page-footer"><span>© TPCM</span><span>YOUR FILES, YOUR PLACE.</span></footer>
    </main>
  );
}

export default AuthPage;
