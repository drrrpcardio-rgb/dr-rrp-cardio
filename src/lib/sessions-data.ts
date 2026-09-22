export interface AgendaItem {
  time: string;
  title: string;
  description: string;
}

export type SessionMode = "online" | "offline" | "hybrid";

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
  /** Optional Google Maps link for the venue. */
  venueMapUrl?: string;
  audience: string[];
  objective: string;
  agenda: AgendaItem[];
}

const ecgLevel1Session: SessionData = {
  id: "rrp-cardio-ecg-level-1-aug-2026",
  courseName: "RRP Cardio ECG – Level 1",
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

/** Date/time/venue/agenda to be finalised — update once confirmed. */
export const featuredSession: SessionData = {
  id: "rrp-cardio-ecg-level-2-oct-2026",
  courseName: "RRP Cardio ECG – Level 2",
  mode: "hybrid",
  title: "ECG – Level 2: Lecture & Hands-on Workshop",
  isoDate: "2026-10-31",
  displayDate: "October 2026 (exact date to be announced)",
  time: "Time to be announced",
  venue: "Aasai Speciality Clinic | Heart Foundation",
  venueMapUrl:
    "https://www.google.com/maps/place/Aasai+Speciality+Clinic+%7C+Heart+Foundation/@11.6780112,78.1388493,17z/data=!3m1!4b1!4m6!3m5!1s0x3babf05b2f01bfdb:0x5b5315f29133acf0!8m2!3d11.6780112!4d78.1414242!16s%2Fg%2F11c6w0mdh0",
  audience: [
    "MBBS Doctors",
    "Practicing Physicians",
    "CTVS Technologists",
    "Nurses",
  ],
  objective:
    "Building on Level 1, a deeper dive into ECG interpretation for real-world clinical practice.",
  agenda: [
    {
      time: "TBA",
      title: "Full agenda to be announced",
      description: "",
    },
  ],
};

/** Every session on the site currently follows this lecture → break → hands-on template. */
export const allSessions: SessionData[] = [featuredSession, ecgLevel1Session];

export function isUpcoming(session: SessionData, today: Date = new Date()) {
  return new Date(session.isoDate) >= today;
}
