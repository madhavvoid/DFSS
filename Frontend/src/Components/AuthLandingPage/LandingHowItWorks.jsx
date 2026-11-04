const steps = [
  { title: "Upload", copy: "Add a file through the secure platform.", icon: "upload" },
  { title: "Split", copy: "Files are divided into smaller chunks with unique hashes.", icon: "split" },
  { title: "Distribute", copy: "Chunks are placed across available storage nodes.", icon: "share" },
  { title: "Replicate", copy: "Copies provide resilience if a node becomes unavailable.", icon: "shield" },
  { title: "Access", copy: "Your file is reconstructed and delivered when requested.", icon: "download" },
];

function StepIcon({ type }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2.2 };
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      {type === "upload" && <path {...common} d="M24 36V10m-11 11L24 10l11 11M9 38h30" />}
      {type === "split" && <g {...common}><rect x="8" y="8" width="12" height="12" rx="2" /><rect x="28" y="8" width="12" height="12" rx="2" /><rect x="8" y="28" width="12" height="12" rx="2" /><rect x="28" y="28" width="12" height="12" rx="2" /></g>}
      {type === "share" && <g {...common}><circle cx="11" cy="24" r="5" /><circle cx="36" cy="11" r="5" /><circle cx="36" cy="37" r="5" /><path d="m16 22 15-8M16 26l15 8" /></g>}
      {type === "shield" && <path {...common} d="M24 6 39 12v11c0 9-6 15-15 19C15 38 9 32 9 23V12l15-6Z" />}
      {type === "download" && <path {...common} d="M24 10v26m-11-11 11 11 11-11M9 40h30" />}
    </svg>
  );
}

function LandingHowItWorks() {
  return (
    <section className="tpcm-how" id="how-it-works">
      <header className="tpcm-section-heading">
        <span>THE STORAGE FLOW</span>
        <h2>How It Works</h2>
        <p>Your file is split, distributed, and replicated across multiple nodes.</p>
      </header>
      <div className="tpcm-steps">
        {steps.map((step, index) => (
          <div className="tpcm-step-wrap" key={step.title}>
            <article className="tpcm-step">
              <span className="tpcm-step-number">{index + 1}</span>
              <span className="tpcm-step-icon"><StepIcon type={step.icon} /></span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
            {index < steps.length - 1 && <span className="tpcm-step-arrow" aria-hidden="true">→</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

export default LandingHowItWorks;