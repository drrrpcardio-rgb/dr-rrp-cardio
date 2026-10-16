import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/ui/LegalPage";
import { brand, contactEmail } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `The terms for using the ${brand.name} website, simulators and programmes.`,
};

const mail = <a href={`mailto:${contactEmail}`}>{contactEmail}</a>;

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      updated="16 October 2026"
      intro={`By using this website, the ECG Mastery and Cath Lab simulators, or enrolling in a programme run by ${brand.name} ("we", "us"), you agree to these terms. If you do not agree, please do not use the site.`}
      sections={[
        {
          heading: "Educational purpose only",
          body: (
            <p>
              All content, including courses, videos, simulators, libraries and procedure
              summaries, is for education and training. It is not medical advice and must not be
              used to diagnose or treat patients. Clinical decisions remain the responsibility of
              the treating clinician, who should follow local protocols and device manufacturers&apos;
              instructions. Some tools have not yet been reviewed by a cardiologist.
            </p>
          ),
        },
        {
          heading: "Who may use the site",
          body: (
            <p>
              Our programmes are intended for doctors, postgraduates, nurses and cath lab or echo
              technicians. You must be at least 18 years old to enrol.
            </p>
          ),
        },
        {
          heading: "Programmes, enrolment and fees",
          body: (
            <>
              <p>
                Course details, dates, fees and formats are published or confirmed at the time of
                enquiry and enrolment and may change. Listing a programme on this site is not a
                guarantee that it will run. If we cancel or reschedule a programme, we will tell
                enrolled participants and handle fees as agreed at enrolment.
              </p>
              <p>
                Refund and transfer terms for each programme are confirmed in writing when you
                enrol.
              </p>
            </>
          ),
        },
        {
          heading: "Certificates",
          body: (
            <p>
              Certificates confirm attendance or completion of a specific programme. They are not a
              licence, registration or accredited qualification unless we state so in writing. We
              may withhold or withdraw a certificate if it was obtained by misrepresentation.
            </p>
          ),
        },
        {
          heading: "Intellectual property",
          body: (
            <p>
              The site, course material, videos, text, logos and simulator software belong to us or
              our licensors. You may use them for personal learning. You may not copy, resell,
              redistribute, record live sessions or scrape the content without written permission.
              Third-party material, such as the BodyParts3D anatomy used in the Cath Lab app, stays
              under its own licence.
            </p>
          ),
        },
        {
          heading: "Acceptable use",
          body: (
            <ul>
              <li>Do not misuse the site, attempt to break or overload it, or access it unlawfully.</li>
              <li>Do not share enrolment access or recordings with people who have not enrolled.</li>
              <li>Do not submit false information through our forms.</li>
            </ul>
          ),
        },
        {
          heading: "No warranty and limit of liability",
          body: (
            <p>
              We work to keep content accurate, but the site and simulators are provided &quot;as
              is&quot; without warranties of any kind. To the fullest extent permitted by law, we are
              not liable for any loss arising from your use of, or reliance on, the site or its
              content.
            </p>
          ),
        },
        {
          heading: "Third-party links",
          body: (
            <p>
              The site links to and embeds services such as YouTube. We are not responsible for
              their content or practices.
            </p>
          ),
        },
        {
          heading: "Privacy",
          body: (
            <p>
              How we handle your information is described in our{" "}
              <Link href="/privacy-policy">Privacy Policy</Link>.
            </p>
          ),
        },
        {
          heading: "Changes and governing law",
          body: (
            <p>
              We may update these terms; the date at the top shows the latest version. These terms
              are governed by the laws of India, and the courts of India have jurisdiction over any
              dispute.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: <p>Questions about these terms? Email {mail}.</p>,
        },
      ]}
    />
  );
}
