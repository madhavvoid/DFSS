function LandingCallToAction({ onOpenAuth }) {
  return (
    <section className="tpcm-cta" id="contact">
      <div className="tpcm-cta-landscape" aria-hidden="true">
        <svg viewBox="0 0 440 120" preserveAspectRatio="none"><path d="M0 68 73 19l56 43 54-55 61 56 55-39 65 45 76-33v84H0Z" fill="#bddbff" /><path d="m0 84 63-34 54 29 61-40 65 45 57-31 72 33 68-41v55H0Z" fill="#94c5ff" /><path d="M51 38 73 24l25 18v20H51zm280 7 25-18 27 22v18h-52z" fill="#fff" opacity=".75" /><path d="M63 55V45l10-7 11 7v17H63zm278 0V46l15-11 16 12v15h-31z" fill="#3c8df5" opacity=".55" /></svg>
      </div>
      <div className="tpcm-cta-copy"><span>READY WHEN YOU ARE</span><h2>Ready to store your files?</h2><p>Create an account and keep your data accessible across your distributed storage system.</p></div>
      <button className="tpcm-primary-button" type="button" onClick={() => onOpenAuth("signup")}>Create an Account <span aria-hidden="true">→</span></button>
    </section>
  );
}

export default LandingCallToAction;