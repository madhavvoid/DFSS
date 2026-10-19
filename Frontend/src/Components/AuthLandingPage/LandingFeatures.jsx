const features = [
  { id: "secure", title: "Secure Storage", copy: "Protect account access with verified sign-in and controlled file operations." },
  { id: "nodes", title: "Distributed Nodes", copy: "Store file chunks across multiple storage nodes for resilient access." },
  { id: "available", title: "High Availability", copy: "Monitor node health and keep data available when a node is offline." },
  { id: "manage", title: "Efficient Management", copy: "Upload, organize, and retrieve files through a simple workspace." },
  { id: "scale", title: "Scalable Architecture", copy: "Add storage nodes as your files and project needs grow." },
];

function FeatureIcon({ type }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2.4 };
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      {type === "secure" && <path {...common} d="M24 5 39 11v11c0 10-6 17-15 21C15 39 9 32 9 22V11l15-6Z" />}
      {type === "nodes" && <g {...common}><circle cx="24" cy="11" r="5" /><circle cx="11" cy="35" r="5" /><circle cx="37" cy="35" r="5" /><path d="m21 16-7 14m13-14 7 14M16 35h16" /></g>}
      {type === "available" && <path {...common} d="m27 5-16 22h12l-2 16 16-24H25l2-14Z" />}
      {type === "manage" && <g {...common}><ellipse cx="24" cy="11" rx="14" ry="6" /><path d="M10 11v10c0 3 6 6 14 6s14-3 14-6V11M10 21v10c0 3 6 6 14 6s14-3 14-6V21M10 31v6c0 3 6 6 14 6s14-3 14-6v-6" /></g>}
      {type === "scale" && <path {...common} d="M9 30h28a8 8 0 0 0 1-16 13 13 0 0 0-25-2A9 9 0 0 0 9 30Zm4 7h22m-17 6h12" />}
    </svg>
  );
}

function LandingFeatures() {
  return (
    <section className="tpcm-features" id="features" aria-label="TPCM features">
      {features.map((feature) => (
        <article className={`tpcm-feature feature-${feature.id}`} key={feature.id} id={feature.id === "nodes" ? "nodes" : feature.id === "secure" ? "about" : undefined}>
          <span className="tpcm-feature-icon"><FeatureIcon type={feature.id} /></span>
          <div><h2>{feature.title}</h2><p>{feature.copy}</p></div>
        </article>
      ))}
    </section>
  );
}

export default LandingFeatures;