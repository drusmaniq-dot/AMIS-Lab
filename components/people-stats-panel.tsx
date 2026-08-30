import Link from "next/link";
import { Card } from "@/components/ui/card";

export interface PersonStatItem {
  id: string;
  fullName: string;
  titleOrRole: string;
  totalPublications: number;
  hIndex: number | null;
  citationCount: number | null;
  scholarUrl: string | null;
}

export interface PeopleStatsPanelDict {
  heading: string;
  publications: string;
  hIndex: string;
  citations: string;
  noData: string;
  viewScholar: string;
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <p className="text-lg font-bold text-primary">{value}</p>
      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{label}</p>
    </div>
  );
}

export function PeopleStatsPanel({ people, dict }: { people: PersonStatItem[]; dict: PeopleStatsPanelDict }) {
  if (people.length === 0) return null;

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-72 lg:self-start">
      <h2 className="text-sm font-semibold text-primary uppercase tracking-wide">{dict.heading}</h2>
      <div className="mt-3 space-y-3">
        {people.map((p) => (
          <Card key={p.id} size="sm" className="p-3">
            <p className="text-sm font-semibold">{p.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{p.titleOrRole}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <Stat value={p.totalPublications} label={dict.publications} />
              <Stat value={p.hIndex ?? dict.noData} label={dict.hIndex} />
              <Stat value={p.citationCount ?? dict.noData} label={dict.citations} />
            </div>
            {p.scholarUrl && (
              <Link
                href={p.scholarUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 block text-center text-[11px] text-accent underline-offset-2 hover:underline"
              >
                {dict.viewScholar}
              </Link>
            )}
          </Card>
        ))}
      </div>
    </aside>
  );
}
