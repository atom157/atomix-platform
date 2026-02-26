import { HeroSection } from "./components/layout/HeroSection";
import { Navbar } from "./components/layout/Navbar";
import { FeaturesSection } from "./components/landing/FeaturesSection";
import { HowItWorksSection } from "./components/landing/HowItWorksSection";
import { PricingSection } from "./components/landing/PricingSection";
import { FAQSection } from "./components/landing/FAQSection";
import { FooterSection } from "./components/landing/FooterSection";

function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-purple-200 font-sans">
      <Navbar />
      <main className="relative flex flex-col flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <FAQSection />
      </main>
      <FooterSection />
    </div>
  );
}

export default App;
