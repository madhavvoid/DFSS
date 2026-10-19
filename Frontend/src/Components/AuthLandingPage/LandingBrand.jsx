function LandingBrand() {
  return (
    <a className="tpcm-brand" href="#home" aria-label="TPCM home">
      <span className="tpcm-brand-mark" aria-hidden="true">
        <svg viewBox="0 0 44 44"><path d="M13.3 31.5h18a8.3 8.3 0 0 0 .6-16.6A10.2 10.2 0 0 0 12.6 18a6.8 6.8 0 0 0 .7 13.5Z" /><path d="M22.3 28V18m-4 4 4-4 4 4" /></svg>
      </span>
      <span className="tpcm-brand-copy"><strong>TPCM</strong><small>Distributed File Storage System</small></span>
    </a>
  );
}

export default LandingBrand;