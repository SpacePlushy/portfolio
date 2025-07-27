"use client";

import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero-section";
import AboutSection from "@/components/about-section";
import ExperienceSection from "@/components/experience-section";
import AchievementsSection from "@/components/achievements-section";
import SkillsSection from "@/components/skills-section";
import EducationSection from "@/components/education-section";
import ContactSection from "@/components/contact-section";
import PortfolioSelection from "@/components/portfolio-selection";
import { usePortfolioVariant } from "@/contexts/portfolio-variant-context";

export default function Home() {
  const variant = usePortfolioVariant();

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      
      {variant === 'general' ? (
        // General landing page layout - only hero, portfolio selection, and contact
        <>
          <PortfolioSelection />
          <ContactSection />
        </>
      ) : (
        // Full portfolio layout for SWE and CSR variants
        <>
          <AboutSection />
          <ExperienceSection />
          <AchievementsSection />
          <SkillsSection />
          <EducationSection />
          <ContactSection />
        </>
      )}
    </div>
  );
}
