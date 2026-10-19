import LandingFooter from "./LandingFooter";
import LandingHeader from "./LandingHeader";
import LandingHero from "./LandingHero";
import LandingFeatures from "./LandingFeatures";
import LandingHowItWorks from "./LandingHowItWorks";
import LandingCallToAction from "./LandingCallToAction";
import "./TpcmLanding.css";

function AuthLandingPage({ onOpenAuth }) {
  return (
    <div className="tpcm-landing">
      <LandingHeader onOpenAuth={onOpenAuth} />
      <main>
        <LandingHero onOpenAuth={onOpenAuth} />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingCallToAction onOpenAuth={onOpenAuth} />
      </main>
      <LandingFooter onOpenAuth={onOpenAuth} />
    </div>
  );
}

export default AuthLandingPage;