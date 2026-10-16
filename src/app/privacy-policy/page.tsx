import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/LegalPage";
import { brand, contactEmail } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${brand.name} collects, uses and protects your personal information.`,
};

const mail = <a href={`mailto:${contactEmail}`}>{contactEmail}</a>;

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="16 October 2026"
      intro={`This policy explains what personal information ${brand.name} ("we", "us") collects through this website and the simulators hosted on it, why we collect it, and the choices you have.`}
      sections={[
        {
          heading: "Information we collect",
          body: (
            <>
              <p>
                <strong>Enquiry form.</strong> When you contact us, we collect the details you type
                in: your name, email address, phone number, profession, the programme you are
                interested in, and your message.
              </p>
              <p>
                <strong>Email.</strong> If you write to us directly, we keep your email address and
                the content of your message.
              </p>
              <p>
                <strong>Browser storage.</strong> The site and simulators save small preferences in
                your browser (for example, that you dismissed the announcement bar, or your
                simulator settings and progress). This stays on your device and is not sent to us.
              </p>
              <p>
                We do not ask for payment details, passwords or government ID numbers on this site,
                and we do not use advertising or analytics trackers.
              </p>
            </>
          ),
        },
        {
          heading: "How we use it",
          body: (
            <ul>
              <li>To reply to your enquiry and give you information about our programmes.</li>
              <li>To tell you about upcoming classes, workshops and courses you asked about.</li>
              <li>To run, secure and improve the website.</li>
            </ul>
          ),
        },
        {
          heading: "Who processes your data",
          body: (
            <>
              <p>
                Enquiry form submissions are delivered to us by email through Web3Forms
                (web3forms.com), which processes the form data on our behalf. The site is hosted on
                GitHub Pages. Free-learning pages show video thumbnails and embedded videos from
                YouTube, so YouTube (Google) may receive technical information such as your IP
                address when those load or play, under its own privacy policy.
              </p>
              <p>We do not sell your personal information.</p>
            </>
          ),
        },
        {
          heading: "How long we keep it",
          body: (
            <p>
              We keep enquiry details only as long as needed to respond and to follow up about
              programmes you asked about, and then delete them or on your request.
            </p>
          ),
        },
        {
          heading: "Your rights",
          body: (
            <p>
              You can ask us to access, correct or delete the personal information we hold about
              you, or to stop contacting you, by emailing {mail}. We will respond within a
              reasonable time.
            </p>
          ),
        },
        {
          heading: "Security",
          body: (
            <p>
              We take reasonable steps to protect your information, but no method of transmission
              over the internet is completely secure.
            </p>
          ),
        },
        {
          heading: "Children",
          body: (
            <p>
              Our programmes are intended for medical professionals and trainees. This site is not
              directed at children under 18.
            </p>
          ),
        },
        {
          heading: "Changes to this policy",
          body: (
            <p>
              We may update this policy from time to time. The date at the top shows when it last
              changed.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: <p>Questions about privacy? Email {mail}.</p>,
        },
      ]}
    />
  );
}
