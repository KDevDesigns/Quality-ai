import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { requireAction } from "@/lib/auth/session";
import { manilaDay, parsePeriod, periodFor, periodLabel, recentPeriods } from "@/lib/dar/period";
import { darStore } from "@/lib/dar/store";
import { db } from "@/lib/db";
import { DarEditor } from "./dar-editor";

export const metadata: Metadata = { title: "My DAR" };

const dar = darStore(db);

export default function DarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <>
      <PageHeader
        title="My DAR"
        description="Your Daily Accomplishment Report for each half-month. The days are filled in from your ticket work in QA Hub; check them, add anything done outside it, then download."
      />
      <Suspense fallback={<LoadingBlock />}>
        <DarBody searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function DarBody({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const me = await requireAction("dar.use");
  const sp = await searchParams;
  const today = manilaDay(new Date());
  const period = parsePeriod(typeof sp.period === "string" ? sp.period : "") ?? periodFor(today);

  const [report, saved, template, profile] = await Promise.all([dar.load(me, period), dar.list(me.id), dar.template(), dar.profile(me.id)]);

  // Recent periods, any older saved ones, and the one asked for: newest first, each once.
  const savedStarts = new Set(saved.map((s) => s.periodStart));
  const all = new Map<string, { start: string; label: string; saved: boolean }>();
  for (const p of [...recentPeriods(today, 8), ...saved.map((s) => ({ start: s.periodStart, end: s.periodEnd })), period]) {
    all.set(p.start, { start: p.start, label: periodLabel(p), saved: savedStarts.has(p.start) });
  }
  const periods = [...all.values()].sort((a, b) => b.start.localeCompare(a.start));

  return (
    <DarEditor
      // A new period, or a different number of duty rows after "My details", starts the editor afresh.
      key={`${period.start}:${report.header.core.length}:${report.header.support.length}`}
      report={report}
      periods={periods}
      template={template}
      profile={{
        fullName: profile?.fullName ?? "",
        position: profile?.position ?? "",
        ownFunctions: !!(profile?.coreFunctions || profile?.supportFunctions),
      }}
      accountName={me.name}
    />
  );
}
