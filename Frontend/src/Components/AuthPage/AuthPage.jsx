import { useState } from "react";
import { requestEmailCode, verifyEmailCode } from "../../services/authService";
import "./AuthPage.css";

function AuthPage({ onAuthenticated, onBack, initialIntent = "signin" }) {
  const [intent, setIntent] = useState(initialIntent);
  const [step, setStep] = useState("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState("email");
  const [code, setCode] = useState("");
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function changeIntent(nextIntent) {
    setIntent(nextIntent);
    setStep("details");
    setCode("");
    setError("");
  }

  function updateEmail(value) {
    setEmail(value);
    setError("");
    if (value.trim()) setChannel("email");
    else if (phone.trim()) setChannel("sms");
  }

  function updatePhone(value) {
    setPhone(value);
    setError("");
    if (value.trim()) setChannel("sms");
    else if (email.trim()) setChannel("email");
  }

  function updateIdentifier(value) {
    setIdentifier(value);
    setError("");
    const trimmedValue = value.trim();
    setChannel(trimmedValue && !trimmedValue.includes("@") ? "sms" : "email");
  }

  function changeChannel(nextChannel) {
    setChannel(nextChannel);
    setError("");
  }

  function requestDetails() {
    return intent === "signup" ? { intent, name, email, phone, channel } : { intent, identifier, channel };
  }

  async function handleRequestCode(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await requestEmailCode(requestDetails());
      setDestination(result.destination);
      setStep("code");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await verifyEmailCode({ ...requestDetails(), code });
      onAuthenticated(result);
    } catch (verificationError) {
      setError(verificationError.message);
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
              <span className="auth-panel-kicker">{step === "code" ? `${channel === "sms" ? "SMS" : "EMAIL"} CONFIRMATION` : "WELCOME TO TPCM"}</span>
              <h2>{step === "code" ? "Check your inbox." : intent === "signup" ? "Create your account" : "Welcome back"}</h2>
            </div>
            {step === "code" && <span className="auth-step-count">02 / 02</span>}
          </div>

          {step === "details" ? (
            <>
              <div className="auth-tabs" role="tablist" aria-label="Account access">
                <button type="button" role="tab" aria-selected={intent === "signin"} className={intent === "signin" ? "selected" : ""} onClick={() => changeIntent("signin")}>Sign in</button>
                <button type="button" role="tab" aria-selected={intent === "signup"} className={intent === "signup" ? "selected" : ""} onClick={() => changeIntent("signup")}>Sign up</button>
              </div>
              <p className="auth-panel-copy">{intent === "signup" ? "Create an account with your email address or phone number." : "Sign in with the email or phone number on your account."}</p>
              <form className="auth-form" onSubmit={handleRequestCode}>
                {intent === "signup" ? (
                  <>
                    <label htmlFor="auth-name">Full name</label>
                    <input id="auth-name" autoComplete="name" maxLength="100" value={name} onChange={(event) => setName(event.target.value)} required />
                    <label htmlFor="auth-email">Email address{channel === "sms" ? " (optional)" : ""}</label>
                    <input id="auth-email" type="email" autoComplete="email" maxLength="254" value={email} onChange={(event) => updateEmail(event.target.value)} required={channel === "email"} />
                    <label htmlFor="auth-phone">Phone number{channel === "email" ? " (optional)" : ""}</label>
                    <input id="auth-phone" type="tel" autoComplete="tel" placeholder="+1 555 123 4567" value={phone} onChange={(event) => updatePhone(event.target.value)} required={channel === "sms"} />
                  </>
                ) : (
                  <>
                    <label htmlFor="auth-identifier">Email or phone number</label>
                    <input id="auth-identifier" autoComplete="username" placeholder="you@example.com or +1 555 123 4567" value={identifier} onChange={(event) => updateIdentifier(event.target.value)} required />
                  </>
                )}
                <fieldset className="auth-channel-fieldset">
                  <legend>Send confirmation code by</legend>
                  <div className="auth-channel-toggle">
                    <button type="button" className={channel === "email" ? "selected" : ""} aria-pressed={channel === "email"} onClick={() => changeChannel("email")}>Email</button>
                    <button type="button" className={channel === "sms" ? "selected" : ""} aria-pressed={channel === "sms"} onClick={() => changeChannel("sms")}>Text message</button>
                  </div>
                </fieldset>
                {error && <p className="auth-page-error" role="alert">{error}</p>}
                <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Sending code…" : `Continue with ${channel === "sms" ? "SMS" : "email"} code`}<span aria-hidden="true">↗</span></button>
              </form>
              <p className="auth-privacy-note">We’ll send a one-time code to your {channel === "sms" ? "phone number" : "email address"}. Codes expire after 10 minutes.</p>
            </>
          ) : (
            <>
              <p className="auth-panel-copy">We sent a six-digit code by {channel === "sms" ? "text message" : "email"} to <strong>{destination}</strong>. Enter it below to {intent === "signup" ? "finish creating your account" : "sign in"}.</p>
              <form className="auth-form code-form" onSubmit={handleVerifyCode}>
                <label htmlFor="auth-code">Verification code</label>
                <input id="auth-code" className="auth-code-input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" placeholder="000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
                {error && <p className="auth-page-error" role="alert">{error}</p>}
                <button className="auth-submit" type="submit" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Verify and continue"}<span aria-hidden="true">↗</span></button>
              </form>
              <div className="auth-code-actions">
                <button type="button" onClick={handleRequestCode} disabled={busy}>Resend code</button>
                <button type="button" onClick={() => { setStep("details"); setCode(""); setError(""); }}>Change details</button>
              </div>
              <p className="auth-privacy-note">Codes expire after 10 minutes. Never share your verification code.</p>
            </>
          )}
        </section>
      </section>
      <footer className="auth-page-footer"><span>© TPCM</span><span>YOUR FILES, YOUR PLACE.</span></footer>
    </main>
  );
}

export default AuthPage;