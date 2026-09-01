import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { SmoothScrollProvider } from "@/lib/smooth-scroll-provider";
import { MotionProvider } from "@/lib/motion-provider";
import { PageTransition } from "@/components/layout/PageTransition";
import { founder } from "@/lib/site-data";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.vectorcardiologyacademy.com"),
  title: {
    default: "Vector Cardiology Academy | Learn. Understand. Apply.",
    template: "%s | Vector Cardiology Academy",
  },
  description: `Structured, practical cardiology education in ECG, Echo, Cath Lab, IVUS and Interventional Cardiology — founded & led by ${founder.name}.`,
  openGraph: {
    title: "Vector Cardiology Academy",
    description: "Learn. Understand. Apply.",
    url: "https://www.vectorcardiologyacademy.com",
    siteName: "Vector Cardiology Academy",
    images: ["/og-image.png"],
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="bg-background text-foreground antialiased">
        <MotionProvider>
          <SmoothScrollProvider>
            <Nav />
            <main className="min-h-screen">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </SmoothScrollProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
