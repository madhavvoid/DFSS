import LandingBrand from "./LandingBrand";

function LandingHeader({ onOpenAuth }) {
  return (
    <header className="tpcm-header">
      <LandingBrand />
      <nav className="tpcm-nav" aria-label="Main navigation">
        <a className="is-current" href="#home">Home</a>
        <a href="#features">Features</a>
        <a href="#how-it-works">How It Works</a>
        <a href="#nodes">Nodes</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
      <div className="tpcm-account-actions">
        <button className="tpcm-login" type="button" onClick={() => onOpenAuth("signin")}>Login</button>
        <button className="tpcm-register" type="button" onClick={() => onOpenAuth("signup")}>Register</button>
      </div>
    </header>
  );
}

export default LandingHeader;