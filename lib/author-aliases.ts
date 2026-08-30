// Publication has no FK to Person — authors are free-text strings. This maps each
// lab member to the exact short-form name used when their publications were imported,
// so publication counts and co-authorship can be derived by array membership.
export const AUTHOR_ALIASES: Record<string, string> = {
  "Prof. Dr. El Sayed Yousef": "E. S. Yousef",
  "Prof. Dr. Alaa Dahshan": "A. Dahshan",
  "Prof. Dr. Hany S. Hussein": "H. S. Hussein",
  "Dr. Khalid Ibrahim Hussein Ibrahim": "K. I. H. Ibrahim",
  "Abdulaziz Ahmed Hadi Asiri": "Abdulaziz A. Asiri",
  "Reem Dhafer Alshehri": "RD Alshehri",
  "Elham Fahad Alkhammash": "E. Alkhammash",
};
