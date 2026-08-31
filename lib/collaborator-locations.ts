// Institutional locations for everyone in the collaboration network, keyed by
// full name. Verified per-person from the actual co-authored paper's affiliation
// metadata (via Crossref/OpenAlex), not assumed from nationality — e.g. Kamal A.
// Aly trained at Al-Azhar (Egypt) but his current, paper-listed affiliation is
// the University of Jeddah, Saudi Arabia, so that's where he's placed.
export interface CollaboratorLocation {
  city: string;
  country: string;
  countryCode: string;
  flag: string;
  lat: number;
  lng: number;
}

export const COLLABORATOR_LOCATIONS: Record<string, CollaboratorLocation> = {
  // King Khalid University, Abha, Saudi Arabia
  "Prof. Dr. El Sayed Yousef": { city: "Abha", country: "Saudi Arabia", countryCode: "SA", flag: "🇸🇦", lat: 18.2164, lng: 42.5053 },
  "Prof. Dr. Alaa Dahshan": { city: "Abha", country: "Saudi Arabia", countryCode: "SA", flag: "🇸🇦", lat: 18.2164, lng: 42.5053 },
  "Prof. Dr. Hany S. Hussein": { city: "Abha", country: "Saudi Arabia", countryCode: "SA", flag: "🇸🇦", lat: 18.2164, lng: 42.5053 },
  "Dr. Khalid Ibrahim Hussein Ibrahim": { city: "Abha", country: "Saudi Arabia", countryCode: "SA", flag: "🇸🇦", lat: 18.2164, lng: 42.5053 },
  "Abdulaziz Ahmed Hadi Asiri": { city: "Abha", country: "Saudi Arabia", countryCode: "SA", flag: "🇸🇦", lat: 18.2164, lng: 42.5053 },
  "Reem Dhafer Alshehri": { city: "Abha", country: "Saudi Arabia", countryCode: "SA", flag: "🇸🇦", lat: 18.2164, lng: 42.5053 },
  "Elham Fahad Alkhammash": { city: "Abha", country: "Saudi Arabia", countryCode: "SA", flag: "🇸🇦", lat: 18.2164, lng: 42.5053 },
  "Mohammed S. Alqahtani": { city: "Abha", country: "Saudi Arabia", countryCode: "SA", flag: "🇸🇦", lat: 18.2164, lng: 42.5053 },
  "Fawaz Alqahtani": { city: "Abha", country: "Saudi Arabia", countryCode: "SA", flag: "🇸🇦", lat: 18.2164, lng: 42.5053 },
  "Mohamed A. Ismeil": { city: "Abha", country: "Saudi Arabia", countryCode: "SA", flag: "🇸🇦", lat: 18.2164, lng: 42.5053 },

  // Elsewhere in Saudi Arabia
  "Kamal A. Aly": { city: "Jeddah", country: "Saudi Arabia", countryCode: "SA", flag: "🇸🇦", lat: 21.4858, lng: 39.1925 },
  "Ehab Mahmoud Mohamed": { city: "Wadi Ad-Dawasir", country: "Saudi Arabia", countryCode: "SA", flag: "🇸🇦", lat: 20.4972, lng: 44.7593 },

  // Egypt
  "Essam Ramadan Shaaban": { city: "Assiut", country: "Egypt", countryCode: "EG", flag: "🇪🇬", lat: 27.1809, lng: 31.1837 },

  // Poland
  "Manuela Reben": { city: "Kraków", country: "Poland", countryCode: "PL", flag: "🇵🇱", lat: 50.0647, lng: 19.945 },

  // India
  "Neeraj Mehta": { city: "Varanasi", country: "India", countryCode: "IN", flag: "🇮🇳", lat: 25.3176, lng: 82.9739 },
};
