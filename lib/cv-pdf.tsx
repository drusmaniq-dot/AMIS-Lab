import "server-only";
import path from "path";
import fs from "fs/promises";
import { Document, Page, View, Text, Image, Link, StyleSheet } from "@react-pdf/renderer";
import type { PublicationValue } from "@/lib/person-cv-helpers";

const HEADER_IMAGE_PATH = path.join(process.cwd(), "public", "branding", "kku-cv-header.png");
// Real pixel dimensions of the rebuilt letterhead — used to keep its aspect ratio exact.
const HEADER_ASPECT = 1600 / 249;

let headerDataUriPromise: Promise<string> | null = null;

async function fileToDataUri(filePath: string, mime: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function loadHeaderDataUri(): Promise<string> {
  if (!headerDataUriPromise) headerDataUriPromise = fileToDataUri(HEADER_IMAGE_PATH, "image/png");
  return headerDataUriPromise;
}

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

async function resolvePhotoDataUri(url?: string | null): Promise<string | undefined> {
  if (!url) return undefined;
  if (url.startsWith("/uploads/") || url.startsWith("/branding/")) {
    const filePath = path.join(process.cwd(), "public", url);
    const mime = MIME_BY_EXT[path.extname(filePath).toLowerCase()] ?? "image/jpeg";
    try {
      return await fileToDataUri(filePath, mime);
    } catch {
      return undefined;
    }
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const res = await fetch(url);
      if (!res.ok) return undefined;
      const mime = res.headers.get("content-type") ?? "image/jpeg";
      const buffer = Buffer.from(await res.arrayBuffer());
      return `data:${mime};base64,${buffer.toString("base64")}`;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 36, paddingHorizontal: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { width: "100%", marginBottom: 18 },
  sectionHeading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
    marginTop: 14,
    marginBottom: 6,
  },
  plainHeading: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6 },
  table: { borderWidth: 1, borderColor: "#333333" },
  row: { flexDirection: "row", borderTopWidth: 1, borderColor: "#333333" },
  rowFirst: { flexDirection: "row" },
  labelCell: {
    width: "28%",
    backgroundColor: "#f2f2f2",
    padding: 5,
    fontFamily: "Helvetica-Bold",
    borderRightWidth: 1,
    borderColor: "#333333",
  },
  valueCell: { width: "72%", padding: 5 },
  personalInfoRow: { flexDirection: "row" },
  personalInfoTable: { flex: 1 },
  photoWrap: { width: 90, height: 110, marginLeft: 10, borderWidth: 1, borderColor: "#333333" },
  photo: { width: "100%", height: "100%", objectFit: "cover" },
  bulletRow: { flexDirection: "row", marginBottom: 4, paddingRight: 4 },
  bulletMark: { width: 8, height: 8, backgroundColor: "#c0392b", marginRight: 6, marginTop: 3 },
  bulletText: { flex: 1, lineHeight: 1.35 },
  numberedRow: { flexDirection: "row", marginBottom: 5 },
  numberMark: { width: 16 },
  numberText: { flex: 1, lineHeight: 1.35 },
  pubRow: { marginBottom: 6, lineHeight: 1.35 },
  signatureBlock: { marginTop: 22, borderTopWidth: 1, borderColor: "#999999", paddingTop: 10 },
  signatureName: { fontFamily: "Helvetica-Bold", color: "#1B4F8C", fontSize: 11, marginBottom: 2 },
  signatureLine: { color: "#333333", marginBottom: 1 },
});

export interface CvPersonData {
  fullName: string;
  titleOrRole: string;
  academicDegree?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  discipline?: string | null;
  subdiscipline?: string | null;
  researchInterests?: string[] | null;
  researchProjects?: string[] | null;
  publications?: PublicationValue[] | null;
  photoUrl?: string | null;
}

export async function CvDocument({ person }: { person: CvPersonData }) {
  const [headerSrc, photoSrc] = await Promise.all([loadHeaderDataUri(), resolvePhotoDataUri(person.photoUrl)]);
  const pageContentWidth = 612 - 40 * 2; // LETTER width minus horizontal padding
  const headerHeight = pageContentWidth / HEADER_ASPECT;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={headerSrc} style={[styles.header, { height: headerHeight }]} />

        <Text style={styles.sectionHeading}>I- Personal Information:</Text>
        <View style={styles.personalInfoRow}>
          <View style={[styles.table, styles.personalInfoTable]}>
            <View style={styles.rowFirst}>
              <Text style={styles.labelCell}>Full Name (English)</Text>
              <Text style={styles.valueCell}>{person.fullName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.labelCell}>Academic Degree</Text>
              <Text style={styles.valueCell}>{person.academicDegree || person.titleOrRole}</Text>
            </View>
            {person.email && (
              <View style={styles.row}>
                <Text style={styles.labelCell}>Email</Text>
                <Text style={styles.valueCell}>{person.email}</Text>
              </View>
            )}
            {(person.address || person.phone) && (
              <View style={styles.row}>
                <Text style={styles.labelCell}>Address</Text>
                <View style={styles.valueCell}>
                  {person.address && <Text>{person.address}</Text>}
                  {person.phone && <Text>Mobile: {person.phone}</Text>}
                  {person.email && <Text>E-mail: {person.email}</Text>}
                </View>
              </View>
            )}
          </View>
          {photoSrc && (
            <View style={styles.photoWrap}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={photoSrc} style={styles.photo} />
            </View>
          )}
        </View>

        {(person.discipline || person.subdiscipline || (person.researchInterests?.length ?? 0) > 0) && (
          <>
            <Text style={styles.sectionHeading}>II- Research Interests:</Text>
            <View style={styles.table}>
              {person.discipline && (
                <View style={styles.rowFirst}>
                  <Text style={styles.labelCell}>Discipline</Text>
                  <Text style={styles.valueCell}>{person.discipline}</Text>
                </View>
              )}
              {person.subdiscipline && (
                <View style={person.discipline ? styles.row : styles.rowFirst}>
                  <Text style={styles.labelCell}>Subdiscipline</Text>
                  <Text style={styles.valueCell}>{person.subdiscipline}</Text>
                </View>
              )}
              {(person.researchInterests?.length ?? 0) > 0 && (
                <View style={person.discipline || person.subdiscipline ? styles.row : styles.rowFirst} wrap={false}>
                  <Text style={styles.labelCell}>Research Interests</Text>
                  <View style={styles.valueCell}>
                    {person.researchInterests!.map((item, i) => (
                      <View key={i} style={styles.bulletRow} wrap={false}>
                        <View style={styles.bulletMark} />
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </>
        )}

        {(person.researchProjects?.length ?? 0) > 0 && (
          <>
            <Text style={styles.plainHeading}>Research Projects</Text>
            {person.researchProjects!.map((item, i) => (
              <View key={i} style={styles.numberedRow} wrap={false}>
                <Text style={styles.numberMark}>{i + 1}.</Text>
                <Text style={styles.numberText}>{item}</Text>
              </View>
            ))}
          </>
        )}

        {(person.publications?.length ?? 0) > 0 && (
          <>
            <Text style={styles.sectionHeading}>III- Publications:</Text>
            {person.publications!.map((pub, i) => (
              <Text key={i} style={styles.pubRow} wrap={false}>
                {pub.url ? (
                  <Link src={pub.url} style={{ color: "#1B4F8C" }}>
                    {pub.citation}
                  </Link>
                ) : (
                  pub.citation
                )}
              </Text>
            ))}
          </>
        )}

        <View style={styles.signatureBlock} wrap={false}>
          <Text style={styles.signatureName}>{person.fullName}</Text>
          {person.address && <Text style={styles.signatureLine}>{person.address}</Text>}
          {person.phone && <Text style={styles.signatureLine}>Mobile: {person.phone}</Text>}
          {person.email && <Text style={styles.signatureLine}>E-mail: {person.email}</Text>}
        </View>
      </Page>
    </Document>
  );
}
