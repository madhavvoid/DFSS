import LandingBrand from "./LandingBrand";

function LandingFooter({ onOpenAuth }) {
  return (
    <footer className="tpcm-footer">
      <LandingBrand />
      <p>Distributed storage, made accessible.</p>
      <div className="tpcm-footer-links">
        <a href="#features">Features</a>
        <a href="#how-it-works">How It Works</a>
        <button type="button" onClick={() => onOpenAuth("signin")}>Login</button>
      </div>
      <span className="tpcm-copyright">© TPCM</span>
    </footer>
  );
}

export default LandingFooter;