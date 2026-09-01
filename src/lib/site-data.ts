/**
 * Single source of truth for founder identity and the official enquiry
 * email. Every component should reference these rather than hardcoding the
 * name/email, so a future correction only needs to happen here.
 */
export const founder = {
  /** Always use the full name — never shorten to "Dr. Rajaram Prasad". */
  name: "Dr. A. Rajaram Prasad",
  title: "Consultant Interventional Cardiologist",
  credentials: "MD, DM, FSCAI",
  role: "Founder & Course Director",
};

export const contactEmail = "vectorcardiologyacademy@gmail.com";

/**
 * Web3Forms access key — delivers ContactForm submissions to `contactEmail`
 * as real emails via https://api.web3forms.com/submit. This key is designed
 * by Web3Forms to be used client-side (it's not a secret credential), so
 * it's safe to ship in the bundle. Get/rotate it at https://web3forms.com.
 */
export const web3formsAccessKey = "d80c625c-0f16-43b6-8168-5b1741e5c962";
