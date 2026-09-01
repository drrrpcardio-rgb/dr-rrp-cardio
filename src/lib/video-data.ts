import { founder } from "./site-data";

export interface VideoEntry {
  id: string;
  title: string;
  description?: string;
  youtubeId: string;
  url: string;
  tag?: string;
}

/** First two entries are real pre-course videos and must stay first in the grid. */
export const freeVideos: VideoEntry[] = [
  {
    id: "how-ecg-produced",
    title: "How is an ECG Produced? | Depolarization & Repolarization Explained",
    description:
      "Explains how cardiac electrical activity produces the ECG waveform, covering depolarization and repolarization in a simple, clear way. Useful for students, interns, residents, and anyone strengthening their ECG basics.",
    youtubeId: "Yu6zewXVSfU",
    url: "https://youtu.be/Yu6zewXVSfU",
    tag: "Pre-Course Video",
  },
  {
    id: "ecg-leads-axis",
    title: "ECG Leads & Axis Explained | How to find the axis?",
    description:
      "A clear walkthrough of ECG lead placement and a practical method for determining cardiac axis.",
    youtubeId: "GQ1YZjJBaD8",
    url: "https://youtu.be/GQ1YZjJBaD8",
    tag: "Pre-Course Video",
  },
];

export const youtubeChannels = {
  // URLs are the real channel handles and must not be changed.
  primary: {
    name: `${founder.name} — Cardiologist`,
    url: "https://www.youtube.com/@dr.rajaramprasad_cardiologist",
  },
  pov: {
    name: `${founder.name} — POV Channel`,
    url: "https://www.youtube.com/@DrRRPsPOV",
  },
};
