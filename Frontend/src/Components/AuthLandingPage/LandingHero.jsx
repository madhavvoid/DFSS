function LandingHero({ onOpenAuth }) {
  return (
    <section className="tpcm-hero" id="home">
      <div className="tpcm-hero-inner">
        <div className="tpcm-hero-copy">
          <div className="tpcm-hero-tags"><span>Secure</span><i /> <span>Scalable</span><i /> <span>Distributed</span></div>
          <h1>Distributed File<br />Storage System</h1>
          <p>Store your files securely across multiple storage nodes with high availability, reliability and performance. Your data stays accessible when you need it.</p>
          <div className="tpcm-hero-actions">
            <button className="tpcm-primary-button" type="button" onClick={() => onOpenAuth("signup")}>Get Started <span aria-hidden="true">→</span></button>
            <a className="tpcm-secondary-button" href="#how-it-works">Learn More</a>
          </div>
        </div>
        <div className="tpcm-hero-art" role="img" aria-label="Files uploaded to a cloud and distributed across multiple storage nodes">
          <svg viewBox="0 0 650 410" aria-hidden="true">
            <defs>
              <linearGradient id="cloudFill" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#56b8ff" /><stop offset="1" stopColor="#0860ed" /></linearGradient>
              <linearGradient id="serverFill" x1="0" x2="1"><stop stopColor="#174ebc" /><stop offset="1" stopColor="#072d78" /></linearGradient>
              <linearGradient id="platformFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#45c9ff" /><stop offset="1" stopColor="#0870f5" /></linearGradient>
              <linearGradient id="skyFade" x1="0" x2="1"><stop stopColor="#eff7ff" stopOpacity="0" /><stop offset="1" stopColor="#d5e8ff" stopOpacity=".9" /></linearGradient>
            </defs>
            <path d="M0 282 74 222l46 24 88-93 78 96 62-66 67 66 68-91 92 95 75-48v205H0Z" fill="#e6f1ff" />
            <path d="m0 321 91-70 87 52 87-65 89 74 84-85 103 83 65-33 44 24v109H0Z" fill="#d5e7ff" opacity=".8" />
            <path d="M0 0h650v410H0z" fill="url(#skyFade)" />
            <g fill="none" stroke="#3787ff" strokeDasharray="3 8" strokeLinecap="round" strokeWidth="3"><path d="M322 124 122 228" /><path d="M326 124 255 228" /><path d="M330 124 389 228" /><path d="M334 124 520 228" /></g>
            <g transform="translate(258 24)"><path d="M56 108H179a44 44 0 0 0 4-88A54 54 0 0 0 80 29 36 36 0 0 0 56 108Z" fill="url(#cloudFill)" /><path d="M118 84V48m-15 15 15-15 15 15" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="9" /></g>
            <g transform="translate(70 211)"><path d="m0 18 56-27 62 27-57 30Z" fill="#8fb9ff" /><path d="m8 21 53 27v102L8 122Z" fill="url(#serverFill)" /><path d="m61 48 49-27v101l-49 28Z" fill="#0a398e" /><path d="m15 49 38 19m-38 11 38 19m-38 10 38 19" stroke="#4f91ff" strokeWidth="2" /><circle cx="22" cy="59" r="3" fill="#43d3d4" /><circle cx="22" cy="91" r="3" fill="#43d3d4" /><circle cx="22" cy="122" r="3" fill="#43d3d4" /></g>
            <g transform="translate(205 225) scale(.78)"><path d="m0 18 56-27 62 27-57 30Z" fill="#8fb9ff" /><path d="m8 21 53 27v102L8 122Z" fill="url(#serverFill)" /><path d="m61 48 49-27v101l-49 28Z" fill="#0a398e" /><path d="m15 49 38 19m-38 11 38 19m-38 10 38 19" stroke="#4f91ff" strokeWidth="2" /><circle cx="22" cy="59" r="3" fill="#43d3d4" /><circle cx="22" cy="91" r="3" fill="#43d3d4" /><circle cx="22" cy="122" r="3" fill="#43d3d4" /></g>
            <g transform="translate(399 225) scale(.78)"><path d="m0 18 56-27 62 27-57 30Z" fill="#8fb9ff" /><path d="m8 21 53 27v102L8 122Z" fill="url(#serverFill)" /><path d="m61 48 49-27v101l-49 28Z" fill="#0a398e" /><path d="m15 49 38 19m-38 11 38 19m-38 10 38 19" stroke="#4f91ff" strokeWidth="2" /><circle cx="22" cy="59" r="3" fill="#43d3d4" /><circle cx="22" cy="91" r="3" fill="#43d3d4" /><circle cx="22" cy="122" r="3" fill="#43d3d4" /></g>
            <g transform="translate(515 211)"><path d="m0 18 56-27 62 27-57 30Z" fill="#8fb9ff" /><path d="m8 21 53 27v102L8 122Z" fill="url(#serverFill)" /><path d="m61 48 49-27v101l-49 28Z" fill="#0a398e" /><path d="m15 49 38 19m-38 11 38 19m-38 10 38 19" stroke="#4f91ff" strokeWidth="2" /><circle cx="22" cy="59" r="3" fill="#43d3d4" /><circle cx="22" cy="91" r="3" fill="#43d3d4" /><circle cx="22" cy="122" r="3" fill="#43d3d4" /></g>
            <ellipse cx="324" cy="350" rx="136" ry="33" fill="#9ceeff" opacity=".65" />
            <path d="M189 330c0-17 61-31 136-31s136 14 136 31-61 32-136 32-136-14-136-32Z" fill="url(#platformFill)" />
            <path d="M201 327c0-12 55-22 124-22s124 10 124 22-55 22-124 22-124-10-124-22Z" fill="#1479ff" />
            <g transform="translate(273 238)"><path d="M7 37h68v54H7z" fill="#ffa928" /><path d="M0 35V17c0-4 3-7 7-7h22l10 10h23c4 0 7 3 7 7v8Z" fill="#ffbd47" /><path d="M79 31h37c4 0 7 3 7 7v45c0 4-3 7-7 7H79Z" fill="#fff" opacity=".96" /><path d="M89 44h23m-23 10h23m-23 10h17" stroke="#8fbaff" strokeLinecap="round" strokeWidth="3" /><path d="M72 22h26c4 0 7 3 7 7v2H79v59h-7Z" fill="#d8e8ff" /></g>
          </svg>
          <span className="tpcm-art-note">Your files,<br />distributed &amp; safe</span>
        </div>
      </div>
    </section>
  );
}

export default LandingHero;