function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <span className="hero-badge">
          Secure • Distributed • Reliable
        </span>

        <h1>
          Store Your Files
          <br />
          <span>Securely. Anywhere.</span>
        </h1>

        <p>
          A distributed file storage system designed to securely
          store, manage, and access your files across a reliable
          network.
        </p>

        <div className="hero-buttons">
          <button className="primary-btn">
            Get Started
          </button>

          <button className="secondary-btn">
            Learn More
          </button>
        </div>
      </div>

      <div className="hero-visual">
        <div className="storage-card">
          <div className="storage-header">
            <span>Storage</span>
            <span>68%</span>
          </div>

          <div className="storage-bar">
            <div className="storage-used"></div>
          </div>

          <p>Distributed across multiple nodes</p>

          <div className="nodes">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;