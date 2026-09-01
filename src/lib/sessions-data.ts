export interface AgendaItem {
  time: string;
  title: string;
  description: string;
}

export type SessionMode = "online" | "offline";

export interface SessionData {
  id: string;
  courseName: string;
  mode: SessionMode;
  title: string;
  /** ISO date used for "Upcoming" vs "Recently Held" comparison. */
  isoDate: string;
  displayDate: string;
  time: string;
  /** Optional — omit rather than filling with a placeholder venue. */
  venue?: string;
  audience: string[];
  objective: string;
  agenda: AgendaItem[];
}

export const featuredSession: SessionData = {
  id: "vector-ecg-level-1-aug-2026",
  courseName: "Vector ECG – Level 1",
  mode: "offline",
  title: "ECG Basics – Level 1: Lecture & Hands-on ECG Workshop",
  isoDate: "2026-08-23",
  displayDate: "23rd August 2026",
  time: "10:00 AM – 1:00 PM",
  audience: [
    "MBBS Doctors",
    "Practicing Physicians",
    "CTVS Technologists",
    "Nurses",
  ],
  objective:
    "To make ECG interpretation simple, systematic and clinically useful.",
  agenda: [
    {
      time: "10:00 – 11:15 AM",
      title: "ECG Basics – Lecture",
      description:
        "A simple and systematic approach to ECG interpretation.",
    },
    {
      time: "11:15 – 11:30 AM",
      title: "Break",
      description: "",
    },
    {
      time: "11:30 AM – 1:00 PM",
      title: "Hands-on ECG Workshop",
      description:
        "ECG interpretation, clinical cases, practical approach to common ECG abnormalities.",
    },
  ],
};

/** Every session on the site currently follows this lecture → break → hands-on template. */
export const allSessions: SessionData[] = [featuredSession];

export function isUpcoming(session: SessionData, today: Date = new Date()) {
  return new Date(session.isoDate) >= today;
}
