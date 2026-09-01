"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/Button";
import { useReducedMotion } from "@/lib/use-reduced-motion";

gsap.registerPlugin(ScrollTrigger);

export function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { backgroundPosition: "50% 30%" },
        {
          backgroundPosition: "50% 70%",
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      className="bg-[length:200%_200%] bg-[radial-gradient(circle_at_center,var(--color-royal-600)_0%,var(--color-royal-900)_75%)] py-24"
    >
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <h2 className="font-heading text-3xl leading-tight font-semibold text-white sm:text-4xl">
          Ready to learn cardiology the structured way?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-royal-100">
          Register your interest and we&rsquo;ll let you know when the next
          course, live class, or workshop opens.
        </p>
        <div className="mt-9">
          <Button href="/contact" variant="gold" size="lg" icon={<ArrowRight size={18} />}>
            Enquire Now
          </Button>
        </div>
      </div>
    </section>
  );
}
