"use client";

import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { staggerItem } from "@/components/ui/Reveal";

export function WorkshopPlaceholderCard() {
  return (
    <motion.div
      variants={staggerItem}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-mist-300 bg-mist-50 p-8 text-center"
    >
      <Wrench size={26} className="text-royal-700" strokeWidth={1.5} />
      <p className="mt-4 text-sm font-medium text-ink-soft">More workshops being scheduled</p>
      <p className="mt-1 text-xs text-mist-600">
        Across Echo, Cath Lab, IVUS, and Interventional Cardiology.
      </p>
    </motion.div>
  );
}
