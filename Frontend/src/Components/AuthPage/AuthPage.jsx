import { useState } from "react";
import { loginWithAdminPassword, loginWithPassword, register, requestPasswordRecovery, resetPassword } from "../../services/authService";
import "./AuthPage.css";

function AuthPage({ onAuthenticated, onBack, initialIntent = "signin" }) {
  const [intent, setIntent] = useState(initialIntent);
  const [step, setStep] = useState("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [destination, setDestination] = useState("");
  const [developmentCode, setDevelopmentCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function changeIntent(nextIntent) {
    setIntent(nextIntent);
    setStep("details");
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setError("");
  }

  function updateEmail(value) {
    setEmail(value);
    setError("");
  }

  function updatePhone(value) {
    setPhone(value);
    setError("");
  }

  function updateIdentifier(value) {
    setIdentifier(value);
    setError("");
  }

  async function handleSignup(event) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await register({ name, email, phone, password });
      onAuthenticated(result);
    } catch (signupError) {
      setError(signupError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordLogin(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const login = intent === "admin" ? loginWithAdminPassword : loginWithPassword;
      const result = await login({ email: identifier, password });
      onAuthenticated(result);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestRecovery(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await requestPasswordRecovery(identifier);
      setDestination(result.destination);
      setDevelopmentCode(result.developmentCode ?? "");
      setCode(result.developmentCode ?? "");
      setPassword("");
      setConfirmPassword("");
      setStep("recovery");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordReset(event) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await resetPassword({ email: identifier, code, password });
      onAuthenticated(result);
    } catch (resetError) {
      setError(resetError.message);
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

        <section className="auth-panel" aria-label={intent === "signup" ? "Create an account" : intent === "admin" ? "Administrator sign in" : "Sign in"}>
          <div className="auth-panel-heading">
            <div>
              <span className="auth-panel-kicker">{step === "recovery" ? "PASSWORD RECOVERY" : "WELCOME TO TPCM"}</span>
              <h2>{step === "recovery" ? "Reset your password." : intent === "signup" ? "Create your account" : intent === "admin" ? "Administrator access" : "Welcome back"}</h2>
            </div>
            {step === "recovery" && <span className="auth-step-count">02 / 02</span>}
          </div>

          {step === "details" ? (
            <>
              <div className="auth-tabs" role="tablist" aria-label="Account access">
                <button type="button" role="tab" aria-selected={intent === "signin"} className={intent === "signin" ? "selected" : ""} onClick={() => changeIntent("signin")}>Sign in</button>
                <button type="button" role="tab" aria-selected={intent === "signup"} className={intent === "signup" ? "selected" : ""} onClick={() => changeIntent("signup")}>Sign up</button>
                <button type="button" role="tab" aria-selected={intent === "admin"} className={intent === "admin" ? "selected" : ""} onClick={() => changeIntent("admin")}>Admin Login</button>
              </div>
              <p className="auth-panel-copy">{intent === "signup" ? "Create an account with your email address and go straight to your dashboard." : intent === "admin" ? "Use an administrator account to open the system console." : "Sign in with your email address and password."}</p>
              <form className="auth-form" onSubmit={intent === "signup" ? handleSignup : handlePasswordLogin}>
                {intent === "signup" ? (
                  <>
                    <label htmlFor="auth-name">Full name</label>
                    <input id="auth-name" autoComplete="name" maxLength="100" value={name} onChange={(event) => setName(event.target.value)} required />
                    <label htmlFor="auth-email">Email address</label>
                    <input id="auth-email" type="email" autoComplete="email" maxLength="254" value={email} onChange={(event) => updateEmail(event.target.value)} required />
                    <label htmlFor="auth-phone">Phone number (optional)</label>
                    <input id="auth-phone" type="tel" autoComplete="tel" placeholder="+1 555 123 4567" value={phone} onChange={(event) => updatePhone(event.target.value)} />
                    <label htmlFor="auth-password">Password</label>
                    <input id="auth-password" type="password" autoComplete="new-password" minLength="8" maxLength="72" value={password} onChange={(event) => setPassword(event.target.value)} required />
                    <label htmlFor="auth-confirm-password">Confirm password</label>
                    <input id="auth-confirm-password" type="password" autoComplete="new-password" minLength="8" maxLength="72" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
                  </>
                ) : (
                  <>
                    <label htmlFor="auth-identifier">{intent === "admin" ? "Administrator email" : "Email address"}</label>
                    <input id="auth-identifier" type="email" autoComplete="username" placeholder="you@example.com" value={identifier} onChange={(event) => updateIdentifier(event.target.value)} required />
                    <label htmlFor="auth-password">Password</label>
                    <input id="auth-password" type="password" autoComplete="current-password" maxLength="72" value={password} onChange={(event) => setPassword(event.target.value)} required />
                    {intent !== "signup" && <button className="auth-recovery-link" type="button" onClick={handleRequestRecovery} disabled={busy || !identifier.trim()}>Forgot password?</button>}
                  </>
                )}
                {error && <p className="auth-page-error" role="alert">{error}</p>}
                <button className="auth-submit" type="submit" disabled={busy}>{busy ? (intent === "signup" ? "Creating account…" : "Signing in…") : intent === "signup" ? "Create account" : intent === "admin" ? "Admin Login" : "Sign in"}<span aria-hidden="true">↗</span></button>
              </form>
              <p className="auth-privacy-note">{intent === "signup" ? "Use at least 8 characters. Your password is stored as a secure hash." : intent === "admin" ? "Administrator access is limited to accounts configured by the system owner." : "Use password recovery if you can’t access your account."}</p>
            </>
          ) : (
            <>
              <p className="auth-panel-copy">
                {developmentCode ? <>A local recovery code was generated for <strong>{destination}</strong>.</> : <>A recovery code was sent to <strong>{destination}</strong>.</>} Enter the code and choose a new password below.
              </p>
              {developmentCode && <p className="auth-development-code" role="status">Local development code: <strong>{developmentCode}</strong></p>}
              <form className="auth-form code-form" onSubmit={handlePasswordReset}>
                <label htmlFor="auth-code">Recovery code</label>
                <input id="auth-code" className="auth-code-input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" placeholder="000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
                <label htmlFor="auth-new-password">New password</label>
                <input id="auth-new-password" type="password" autoComplete="new-password" minLength="8" maxLength="72" value={password} onChange={(event) => setPassword(event.target.value)} required />
                <label htmlFor="auth-confirm-new-password">Confirm new password</label>
                <input id="auth-confirm-new-password" type="password" autoComplete="new-password" minLength="8" maxLength="72" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
                {error && <p className="auth-page-error" role="alert">{error}</p>}
                <button className="auth-submit" type="submit" disabled={busy || code.length !== 6}>{busy ? "Resetting password…" : "Reset password and sign in"}<span aria-hidden="true">↗</span></button>
              </form>
              <div className="auth-code-actions">
                <button type="button" onClick={handleRequestRecovery} disabled={busy}>Resend code</button>
                <button type="button" onClick={() => { setStep("details"); setCode(""); setError(""); }}>Change details</button>
              </div>
              <p className="auth-privacy-note">Recovery codes expire after 10 minutes and can only reset your password.</p>
            </>
          )}
        </section>
      </section>
      <footer className="auth-page-footer"><span>© TPCM</span><span>YOUR FILES, YOUR PLACE.</span></footer>
    </main>
  );
}

export default AuthPage;