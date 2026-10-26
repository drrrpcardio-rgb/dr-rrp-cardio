"use client";

import { FormEvent, useState } from "react";
import { Mail } from "lucide-react";
import { brand, contactEmail } from "@/lib/site-data";

/**
 * There is no list of issued certificates online yet, so verification is done by email:
 * the form opens a pre-filled message and the team replies after checking their records.
 */
export function VerifyForm() {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const n = value.trim();
    if (!n) return;
    const subject = encodeURIComponent(`Certificate verification: ${n}`);
    const body = encodeURIComponent(`Please confirm whether certificate number ${n} was issued by ${brand.name}.\n\nName on the certificate (if known):\n`);
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="rounded-2xl border border-mist-200 bg-white p-8 shadow-sm">
      <h3 className="font-heading text-lg font-semibold text-ink">Verify a certificate</h3>
      <p className="mt-1.5 text-sm text-mist-700">
        Enter the certificate number printed on the document (e.g. {brand.certificatePrefix}-ECG1-000123). We check it against our records and
        reply by email.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Certificate number</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Certificate number"
            className="w-full rounded-full border border-mist-300 bg-white px-5 py-3 text-sm text-ink outline-none transition-colors focus:border-royal-500"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-royal-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-royal-800"
        >
          <Mail size={16} aria-hidden="true" />
          Request verification
        </button>
      </form>
      <p className="mt-3 text-xs text-mist-600">
        Opens your email app. You can also write to{" "}
        <a href={`mailto:${contactEmail}`} className="font-medium text-royal-700 underline-offset-2 hover:underline">
          {contactEmail}
        </a>
        .
      </p>
    </div>
  );
}
