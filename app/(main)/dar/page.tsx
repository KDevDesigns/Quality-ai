import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DarSkeleton } from "@/components/skeletons";
import { requireAction } from "@/lib/auth/session";
import { firstPeriodOf, manilaDay, parsePeriod, periodFor, periodLabel, periodsFrom } from "@/lib/dar/period";
import { darStore } from "@/lib/dar/store";
import { db } from "@/lib/db";
import { DarEditor } from "./dar-editor";

export const metadata: Metadata = { title: "My DAR" };

const dar = darStore(db);

export default function DarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<DarSkeleton />}>
      <DarBody searchParams={searchParams} />
    </Suspense>
  );
}

async function DarBody({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const me = await requireAction("dar.use");
  const sp = await searchParams;
  const today = manilaDay(new Date());
  const [saved, profile] = await Promise.all([dar.list(me.id), dar.profile(me.id)]);
  const first = firstPeriodOf(profile?.firstPeriodStart, saved.map((s) => s.periodStart));
  // A first period still to come opens on that one, not on today's, which isn't in their list.
  const current = first && first.start > periodFor(today).start ? first : periodFor(today);
  const period = parsePeriod(typeof sp.period === "string" ? sp.period : "") ?? current;
  const report = await dar.load(me, period);

  // Their periods from the first one, any saved outside those, and the one asked for: newest first, each once.
  const savedStarts = new Set(saved.map((s) => s.periodStart));
  const all = new Map<string, { start: string; label: string; saved: boolean }>();
  for (const p of [...(first ? periodsFrom(first, today) : [periodFor(today)]), ...saved.map((s) => ({ start: s.periodStart, end: s.periodEnd })), period]) {
    all.set(p.start, { start: p.start, label: periodLabel(p), saved: savedStarts.has(p.start) });
  }
  const periods = [...all.values()].sort((a, b) => b.start.localeCompare(a.start));

  return (
    <>
      <PageHeader
        title="My DAR"
        description="Your Daily Accomplishment Report for each half-month. Set it up once under My details; the days are filled in from your ticket work in QA Hub. Check them, add anything done outside it, then download."
      />
      <DarEditor
        // A new period, or a different number of duty rows after "My details", starts the editor afresh.
        key={`${period.start}:${report.header.core.length}:${report.header.support.length}`}
        report={report}
        periods={periods}
        hasFullName={!!profile?.fullName}
        accountName={me.name}
        needsFirstPeriod={!first}
      />
    </>
  );
}
