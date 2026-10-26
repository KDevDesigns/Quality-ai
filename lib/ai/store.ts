import "server-only";
import { db } from "@/lib/db";
import type { AuditStatus } from "@/lib/generated/prisma/client";
import { aiSettings, readAiSettings, type AiSettings } from "@/lib/schemas/settings";
import { monthStart } from "./budget";
import type { AuditEntry, AuditSink } from "./router";

const SETTINGS_KEY = "ai";

export const prismaAuditSink: AuditSink = {
  async write(e: AuditEntry) {
    await db.auditLog.create({ data: { ...e, status: e.status as AuditStatus } });
  },
  async cloudSpendSince(since: Date) {
    const r = await db.auditLog.aggregate({ where: { provider: "anthropic", at: { gte: since } }, _sum: { costMicroUsd: true } });
    return r._sum.costMicroUsd ?? 0;
  },
};

export async function getAiSettings(): Promise<AiSettings> {
  const row = await db.setting.findUnique({ where: { key: SETTINGS_KEY } });
  return readAiSettings(row?.value);
}

/** Validates the merged settings; throws a ZodError the caller turns into field errors. */
export async function saveAiSettings(patch: Partial<AiSettings>): Promise<AiSettings> {
  const current = await getAiSettings();
  const next = aiSettings.parse({ ...current, ...patch });
  await db.setting.upsert({ where: { key: SETTINGS_KEY }, update: { value: next }, create: { key: SETTINGS_KEY, value: next } });
  return next;
}

export type AuditFilter = { provider?: string; task?: string; status?: string };

export async function listAudit(filter: AuditFilter, take = 200) {
  return db.auditLog.findMany({
    where: {
      ...(filter.provider ? { provider: filter.provider } : {}),
      ...(filter.task ? { task: filter.task } : {}),
      ...(filter.status ? { status: filter.status as AuditStatus } : {}),
    },
    orderBy: { at: "desc" },
    take,
  });
}

export async function monthSummary(now = new Date()) {
  const since = monthStart(now);
  const [cloud, local, blocked] = await Promise.all([
    db.auditLog.aggregate({ where: { provider: "anthropic", status: "OK", at: { gte: since } }, _sum: { costMicroUsd: true, tokensIn: true, tokensOut: true }, _count: true }),
    db.auditLog.count({ where: { provider: "local", status: "OK", at: { gte: since } } }),
    db.auditLog.count({ where: { status: "BLOCKED", at: { gte: since } } }),
  ]);
  return {
    cloudCalls: cloud._count,
    spentMicroUsd: cloud._sum.costMicroUsd ?? 0,
    tokensIn: cloud._sum.tokensIn ?? 0,
    tokensOut: cloud._sum.tokensOut ?? 0,
    localCalls: local,
    blocked,
  };
}
