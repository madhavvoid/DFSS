function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        DFSS<span>.</span>
      </div>

      <div className="nav-links">
        <a href="#home">Home</a>
        <a href="#features">Features</a>
        <a href="#how-it-works">How It Works</a>
        <a href="#about">About</a>
      </div>

      <div className="nav-actions">
        <button className="login-btn">Login</button>
        <button className="signup-btn">Get Started</button>
      </div>
    </nav>
  );
}

export default Navbar;