import { Hero } from "@/components/home/Hero";
import { SimulationLab } from "@/components/home/SimulationLab";
import { StatsBar } from "@/components/home/StatsBar";
import { TopicStrip } from "@/components/home/TopicStrip";
import { LearningPath } from "@/components/home/LearningPath";
import { HomeFAQ } from "@/components/home/HomeFAQ";
import { FeaturedCourses } from "@/components/home/FeaturedCourses";
import { FounderIntro } from "@/components/home/FounderIntro";
import { TeachingModel } from "@/components/home/TeachingModel";
import { UpcomingProgrammes } from "@/components/home/UpcomingProgrammes";
import { CertificateSection } from "@/components/home/CertificateSection";
import { FreeLearningStrip } from "@/components/home/FreeLearningStrip";
import { LatestCaseFiles } from "@/components/home/LatestCaseFiles";
import { FinalCTA } from "@/components/home/FinalCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <TopicStrip />
      <LearningPath />
      <SimulationLab />
      <FeaturedCourses />
      <FounderIntro />
      <TeachingModel />
      <UpcomingProgrammes />
      <LatestCaseFiles />
      <CertificateSection />
      <FreeLearningStrip />
      <HomeFAQ />
      <FinalCTA />
    </>
  );
}
