import { Hero } from "@/components/home/Hero";
import { SimulationLab } from "@/components/home/SimulationLab";
import { VisionStrip } from "@/components/home/VisionStrip";
import { StatsBar } from "@/components/home/StatsBar";
import { HomeFAQ } from "@/components/home/HomeFAQ";
import { FeaturedCourses } from "@/components/home/FeaturedCourses";
import { FounderIntro } from "@/components/home/FounderIntro";
import { TeachingModel } from "@/components/home/TeachingModel";
import { UpcomingProgrammes } from "@/components/home/UpcomingProgrammes";
import { CertificateSection } from "@/components/home/CertificateSection";
import { FreeLearningStrip } from "@/components/home/FreeLearningStrip";
import { FinalCTA } from "@/components/home/FinalCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <VisionStrip />
      <SimulationLab />
      <FeaturedCourses />
      <FounderIntro />
      <TeachingModel />
      <UpcomingProgrammes />
      <CertificateSection />
      <FreeLearningStrip />
      <HomeFAQ />
      <FinalCTA />
    </>
  );
}
