import type { IconType } from "react-icons";
import {
  FaLinkedin,
  FaXTwitter,
  FaYoutube,
  FaFacebook,
  FaInstagram,
  FaGithub,
  FaResearchgate,
  FaOrcid,
  FaGoogleScholar,
  FaGlobe,
  FaLink,
} from "react-icons/fa6";

const ICONS: Record<string, IconType> = {
  linkedin: FaLinkedin,
  x: FaXTwitter,
  twitter: FaXTwitter,
  youtube: FaYoutube,
  facebook: FaFacebook,
  instagram: FaInstagram,
  github: FaGithub,
  researchgate: FaResearchgate,
  orcid: FaOrcid,
  scholar: FaGoogleScholar,
  googlescholar: FaGoogleScholar,
  website: FaGlobe,
  ieee: FaGlobe,
};

/** Resolves an icon slug or a free-text platform/profile label to a brand icon, falling back to a generic link icon. */
export function resolveIcon(slugOrLabel: string | null | undefined): IconType {
  if (!slugOrLabel) return FaLink;
  const key = slugOrLabel.toLowerCase().replace(/[^a-z]/g, "");
  for (const [needle, icon] of Object.entries(ICONS)) {
    if (key.includes(needle)) return icon;
  }
  return FaLink;
}

const BRAND_COLORS: Record<string, string> = {
  linkedin: "#0A66C2",
  x: "#000000",
  twitter: "#1DA1F2",
  youtube: "#FF0000",
  facebook: "#1877F2",
  instagram: "#E4405F",
  github: "#181717",
  researchgate: "#00CCBB",
  orcid: "#A6CE39",
  scholar: "#4285F4",
  googlescholar: "#4285F4",
  ieee: "#00629B",
  doi: "#FAAB18",
};

/** Resolves a slug or free-text label to that platform's real brand color, for rendering
 * icons "in original colours" instead of a flat neutral tint. Returns null for anything
 * without a known brand color (generic links, DOIs without the word "doi", etc). */
export function resolveIconColor(slugOrLabel: string | null | undefined): string | null {
  if (!slugOrLabel) return null;
  const key = slugOrLabel.toLowerCase().replace(/[^a-z]/g, "");
  for (const [needle, color] of Object.entries(BRAND_COLORS)) {
    if (key.includes(needle)) return color;
  }
  return null;
}
