"use client";

import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Status = "idle" | "loading" | "found" | "not-found";

/**
 * UI-only verification: no backend exists yet. A real implementation would
 * POST to /api/certificates/verify (or similar route handler) and look the
 * number up against issued certificates.
 */
export function VerifyForm() {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setStatus("loading");
    // Mock lookup — replace with a real API call, e.g.:
    // const res = await fetch(`/api/certificates/verify?number=${value}`);
    setTimeout(() => {
      setStatus(value.trim().toUpperCase().startsWith("VCA") ? "found" : "not-found");
    }, 900);
  }

  return (
    <div className="rounded-2xl border border-mist-200 bg-white p-8 shadow-sm">
      <h3 className="font-heading text-lg font-semibold text-ink">Verify a certificate</h3>
      <p className="mt-1.5 text-sm text-mist-700">
        Enter the certificate number printed on the document (e.g. VCA-ECG1-000123).
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setStatus("idle");
            }}
            placeholder="Certificate number"
            className="w-full rounded-full border border-mist-300 bg-white px-5 py-3 text-sm text-ink outline-none transition-colors focus:border-royal-500"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-royal-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-royal-800"
        >
          {status === "loading" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
          Verify
        </button>
      </form>

      <AnimatePresence mode="wait">
        {status === "found" && (
          <motion.div
            key="found"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 flex items-center gap-2.5 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            <CheckCircle2 size={18} className="shrink-0" />
            This certificate number is valid and on record.
          </motion.div>
        )}
        {status === "not-found" && (
          <motion.div
            key="not-found"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <XCircle size={18} className="shrink-0" />
            We couldn&rsquo;t find a certificate with that number. Double-check and try again.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
