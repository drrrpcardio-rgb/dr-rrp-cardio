import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { StaggerGroup, Reveal } from "@/components/ui/Reveal";
import { VideoGridItem } from "@/components/video/VideoGridItem";
import { Button } from "@/components/ui/Button";
import { freeVideos, youtubeChannels } from "@/lib/video-data";

export const metadata: Metadata = {
  title: "Free Learning",
  description: "Free ECG and cardiology lessons from Vector Cardiology Academy's YouTube channels.",
};

export default function FreeLearningPage() {
  return (
    <>
      <PageHero
        eyebrow="Free Learning"
        title="Start here, free"
        description="Short, focused lessons on YouTube that build real understanding — and connect directly into the structured academy courses."
      />

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {freeVideos.map((video) => (
            <VideoGridItem key={video.id} video={video} />
          ))}
        </StaggerGroup>

        <Reveal delay={0.15}>
          <div className="mt-16 flex flex-col items-center gap-5 rounded-2xl border border-royal-100 bg-royal-50 p-10 text-center">
            <p className="font-heading text-xl font-semibold text-ink">
              These free lessons are the first step
            </p>
            <p className="max-w-lg text-sm text-mist-700">
              Once the fundamentals click, the structured Vector courses take
              you further — systematic frameworks, more cases, live
              discussion, and a certificate at the end.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button href="/courses">Explore Courses</Button>
              <a
                href={youtubeChannels.primary.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-royal-200 px-5 py-2.5 text-sm font-medium text-royal-800 hover:border-royal-400 hover:bg-white"
              >
                Visit the YouTube Channel
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
