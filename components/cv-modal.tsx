"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { extractKeywords } from "@/lib/keywords";

export interface CvModalPublication {
  citation: string;
  url?: string;
}

export interface CvModalProfileLink {
  label: string;
  url: string;
}

export interface CvModalData {
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
  publications?: CvModalPublication[] | null;
  profileLinks?: CvModalProfileLink[];
  downloadHref?: string | null;
  photoUrl?: string | null;
}

export interface CvModalDict {
  personalInformation: string;
  name: string;
  qualification: string;
  address: string;
  researchInterests: string;
  publications: string;
  researchProfileLinks: string;
  downloadPdf: string;
}

export function CvModalTrigger({ data, label, dict }: { data: CvModalData; label: string; dict: CvModalDict }) {
  const hasInterests = (data.researchInterests?.length ?? 0) > 0 || (data.researchProjects?.length ?? 0) > 0;
  const hasPublications = (data.publications?.length ?? 0) > 0;
  const hasLinks = (data.profileLinks?.length ?? 0) > 0;
  const keywords = extractKeywords(data.researchInterests ?? []);

  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <FileText className="size-4" />
        {label}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] w-full max-w-3xl overflow-y-auto p-6 sm:max-w-3xl sm:p-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/branding/kku-cv-header.png" alt="King Khalid University" className="w-full rounded-md" />

        <div className="text-center">
          <h2 className="text-xl font-bold text-primary sm:text-2xl">{data.fullName}</h2>
          <p className="mt-1 text-sm text-accent sm:text-base">{data.academicDegree || data.titleOrRole}</p>
        </div>

        <div className="flex flex-row-reverse items-start gap-4 rtl:flex-row">
          {data.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.photoUrl}
              alt={data.fullName}
              className="size-24 shrink-0 rounded-full border object-cover sm:size-28"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-primary">{dict.personalInformation}</h3>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div className="flex flex-wrap gap-x-2">
                <dt className="shrink-0 font-medium">{dict.name}:</dt>
                <dd className="text-muted-foreground">{data.fullName}</dd>
              </div>
              {(data.academicDegree || data.titleOrRole) && (
                <div className="flex flex-wrap gap-x-2">
                  <dt className="shrink-0 font-medium">{dict.qualification}:</dt>
                  <dd className="text-muted-foreground">{data.academicDegree || data.titleOrRole}</dd>
                </div>
              )}
              {(data.address || data.phone || data.email) && (
                <div className="flex flex-wrap gap-x-2">
                  <dt className="shrink-0 font-medium">{dict.address}:</dt>
                  <dd className="text-muted-foreground">
                    {data.address}
                    {data.phone && (
                      <>
                        <br />
                        Mobile: {data.phone}
                      </>
                    )}
                    {data.email && (
                      <>
                        <br />
                        Email: {data.email}
                      </>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {hasInterests && (
          <div>
            <h3 className="text-base font-bold text-primary">{dict.researchInterests}</h3>
            {keywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {keywords.map((kw, i) => (
                  <Badge key={i} variant="secondary">
                    {kw}
                  </Badge>
                ))}
              </div>
            )}
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {data.researchInterests?.map((item, i) => (
                <li key={`ri-${i}`}>{item}</li>
              ))}
              {data.researchProjects?.map((item, i) => (
                <li key={`rp-${i}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {hasPublications && (
          <div>
            <h3 className="text-base font-bold text-primary">{dict.publications}</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {data.publications!.map((pub, i) => (
                <li key={i}>
                  {pub.url ? (
                    <Link href={pub.url} target="_blank" rel="noreferrer noopener" className="text-accent underline">
                      {pub.citation}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">{pub.citation}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasLinks && (
          <div>
            <h3 className="text-base font-bold text-primary">{dict.researchProfileLinks}</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {data.profileLinks!.map((link, i) => (
                <li key={i}>
                  <Link href={link.url} target="_blank" rel="noreferrer noopener" className="text-accent underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.downloadHref && (
          <div className="border-t pt-3">
            <Link
              href={data.downloadHref}
              target="_blank"
              rel="noreferrer noopener"
              className="text-xs text-muted-foreground underline"
            >
              {dict.downloadPdf}
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
