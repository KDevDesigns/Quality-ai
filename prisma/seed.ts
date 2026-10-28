import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, type ModuleCode } from "../lib/generated/prisma/client";
import { importAreas } from "../lib/areas/import";
import { MODULE_LABELS } from "../lib/schemas/common";
import { processInput } from "../lib/schemas/process";
import { riskInput } from "../lib/schemas/risk";
import { riskScore } from "../lib/risk/score";

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }) });

const MODULE_DESCRIPTIONS: Record<ModuleCode, string> = {
  BILLING: "Meter-to-Cash: customer → meter reading → bill run → payment → GL posting",
  P2P: "Procure-to-Pay: purchase request → approval → PO → receiving → 3-way match → voucher → payment",
  FINANCE: "Record-to-Report: journals → postings → period close → trial balance and reports",
  HR: "Hire-to-Retire / Time-to-Pay: employee → attendance/leave → payroll → deductions → payslip → GL",
};

type SeedStep = { name: string; module?: ModuleCode; handoff?: boolean };

const PROCESSES: { module: ModuleCode; name: string; description: string; steps: SeedStep[] }[] = [
  {
    module: "BILLING",
    name: "Meter-to-Cash",
    description: "Customer account to cash collected and posted to the GL.",
    steps: [
      { name: "Create customer account and install meter" },
      { name: "Record meter reading (validate vs previous, flag abnormal)" },
      { name: "Bill run per zone/route" },
      { name: "Verify bill lines against tariff oracle" },
      { name: "Apply penalties after due date" },
      { name: "Post payment and issue OR" },
      { name: "Daily collection report = sum of ORs = deposit" },
      { name: "Post collections and AR to GL", module: "FINANCE", handoff: true },
    ],
  },
  {
    module: "P2P",
    name: "Procure-to-Pay",
    description: "Purchase request through payment, with inventory and GL effects.",
    steps: [
      { name: "Create purchase request" },
      { name: "Approve by amount threshold; check budget availability" },
      { name: "Issue purchase order" },
      { name: "Receive goods (partial allowed, over-receipt blocked)" },
      { name: "Inspection and acceptance; update inventory" },
      { name: "Record supplier invoice" },
      { name: "3-way match (PO × receipt × invoice)" },
      { name: "Prepare and approve disbursement voucher", module: "FINANCE", handoff: true },
      { name: "Pay supplier and post AP/cash to GL", module: "FINANCE", handoff: true },
    ],
  },
  {
    module: "FINANCE",
    name: "Record-to-Report",
    description: "Journals through period close and financial reports.",
    steps: [
      { name: "Post journal entries (debits = credits)" },
      { name: "Reconcile subledgers to GL control accounts (AR, AP, inventory, payroll payable)" },
      { name: "Close period; postings into closed period rejected" },
      { name: "Generate trial balance" },
      { name: "Generate financial statements; exports match on-screen totals" },
    ],
  },
  {
    module: "HR",
    name: "Hire-to-Retire / Time-to-Pay",
    description: "Employee setup through payroll and GL posting.",
    steps: [
      { name: "Create employee record" },
      { name: "Record attendance and leave" },
      { name: "Run payroll (gross)" },
      { name: "Compute deductions (GSIS, PhilHealth, Pag-IBIG, withholding tax) vs payroll oracle" },
      { name: "Approve payroll" },
      { name: "Release payslips (employee sees own only)" },
      { name: "Post payroll to GL", module: "FINANCE", handoff: true },
    ],
  },
  // DCWD BCA API workflows, from docs/erp/bca-api-process-flow.md.
  {
    module: "BILLING",
    name: "Meter reading field-to-bill",
    description: "Reader books from billing schedule to verified readings. Book states: To Do → For Download → Downloaded → In Progress → Complete → For Review → Verified.",
    steps: [
      { name: "Scheduler creates and assigns meter-reader books from the billing schedule" },
      { name: "Reader authenticates on the allowed office network" },
      { name: "Reader downloads the assigned book" },
      { name: "Capture readings, remarks, photos and manifest on the phone" },
      { name: "Upload completion: manifest compared with stored records in one transaction" },
      { name: "Supervisor review; corrections stored as edit records with reasons" },
      { name: "Verify book for billing use" },
    ],
  },
  {
    module: "BILLING",
    name: "JMS service job",
    description: "Configurable service/maintenance job with an ordered process sequence per JMS code.",
    steps: [
      { name: "Create JMS from a CRM ticket or direct request" },
      { name: "Build the code-specific process sequence" },
      { name: "Requirements gate" },
      { name: "Dispatch maintenance order / field investigation" },
      { name: "Payment or adjustment work (OP, BAM, DM/CM) as configured" },
      { name: "MCR and/or automatic posting" },
      { name: "Notify customer, update CRM ticket, complete job" },
    ],
  },
  {
    module: "BILLING",
    name: "MCR change control",
    description: "Controlled customer-record change. States: Draft → Submitted → Returned/Validated → Approved → Posted, or Void.",
    steps: [
      { name: "Create MCR draft" },
      { name: "Submit" },
      { name: "Validate or return to preparer" },
      { name: "Approve (customer record unchanged)" },
      { name: "Post: re-run readiness checks, then apply the change to the customer record" },
      { name: "Advance JMS work, run follow-up or marginal billing, notify and update CRM ticket" },
    ],
  },
  {
    module: "BILLING",
    name: "NSC new service connection",
    description: "New-service-connection application from intake to BCS account number.",
    steps: [
      { name: "Customer portal or CSA walk-in intake" },
      { name: "Duplicate and location checks; upload requirements" },
      { name: "Requirements verification / endorsement" },
      { name: "Field investigation (re-investigation, disqualification or waiver review)" },
      { name: "Payment verification" },
      { name: "Contract signing" },
      { name: "Installation assignment, field details and completion" },
      { name: "Queue BCS export" },
      { name: "BCS reconciliation returns the account number" },
    ],
  },
  {
    module: "BILLING",
    name: "Order of Payment",
    description: "OP lifecycle: Pending → Paid, with the paid-order sweep releasing eligible JMS processes.",
    steps: [
      { name: "Create OP: validate amount, type/COA, customer and JMS prerequisite" },
      { name: "Generate reference number; status Pending" },
      { name: "Customer pays at office, teller or bank" },
      { name: "Paid-order sweep (every 2 minutes) records payment in JMS" },
      { name: "Release newly eligible automatic JMS process" },
    ],
  },
  {
    module: "BILLING",
    name: "BAM / Debit-Credit memo",
    description: "Billing adjustments with validation, approval and posting stages; balances change only at posting.",
    steps: [
      { name: "Prepare BAM, debit memo or credit memo" },
      { name: "Validate" },
      { name: "Approve (approver ≠ preparer)" },
      { name: "Post: update customer balance and accounting" },
      { name: "Appears in billing and daily reports", module: "FINANCE", handoff: true },
    ],
  },
];

const RISKS: { module: ModuleCode; process?: string; title: string; characteristic: string; l: number; i: number; mitigation: string }[] = [
  { module: "BILLING", process: "Meter-to-Cash", title: "Tariff tier boundary miscalculation", characteristic: "Functional suitability", l: 4, i: 5, mitigation: "Tariff oracle; BVA at every tier boundary ±1 m³ per customer class" },
  { module: "BILLING", process: "Meter-to-Cash", title: "OR number gaps or duplicates", characteristic: "Security", l: 3, i: 5, mitigation: "Recon check for OR sequence per collector/series" },
  { module: "BILLING", process: "Meter-to-Cash", title: "Duplicate bills in a bill run", characteristic: "Reliability", l: 2, i: 5, mitigation: "Bill count = active billable accounts; duplicate-bill recon query" },
  { module: "BILLING", process: "Meter-to-Cash", title: "Payment reversal without approval", characteristic: "Security", l: 2, i: 4, mitigation: "Controls suite: approval enforcement and SoD" },
  { module: "P2P", process: "Procure-to-Pay", title: "Payment released without 3-way match", characteristic: "Functional suitability", l: 3, i: 5, mitigation: "Process suite assertion at voucher step; tolerance decision table" },
  { module: "P2P", process: "Procure-to-Pay", title: "Negative stock after issuance", characteristic: "Reliability", l: 3, i: 3, mitigation: "Negative-stock recon check; inventory oracle" },
  { module: "FINANCE", process: "Record-to-Report", title: "Unbalanced journal posted", characteristic: "Functional suitability", l: 2, i: 5, mitigation: "Debit = credit recon check after every run" },
  { module: "FINANCE", process: "Record-to-Report", title: "Posting accepted into a closed period", characteristic: "Functional suitability", l: 2, i: 4, mitigation: "R2R suite negative test" },
  { module: "HR", process: "Hire-to-Retire / Time-to-Pay", title: "Wrong contribution or tax table applied", characteristic: "Functional suitability", l: 3, i: 4, mitigation: "Payroll oracle with tables as data files" },
  { module: "HR", process: "Hire-to-Retire / Time-to-Pay", title: "Employee can view another employee's payslip", characteristic: "Security", l: 2, i: 5, mitigation: "RBAC/IDOR tests through UI and API" },
  { module: "BILLING", title: "Bill run too slow at month-end volume", characteristic: "Performance efficiency", l: 3, i: 2, mitigation: "k6 bill-run test in Phase 10" },
  { module: "FINANCE", title: "Report exports render ñ and special characters incorrectly", characteristic: "Compatibility", l: 2, i: 2, mitigation: "Data-driven tests with Filipino names" },
];

async function main() {
  await db.project.upsert({
    where: { name: "In-house ERP" },
    update: {},
    create: {
      name: "In-house ERP",
      description: "Billing & Collection, Procurement & Inventory, Finance & Accounting, HR & Payroll",
      environments: {
        create: {
          name: "staging",
          baseUrls: ["https://erp-staging.example.local"],
          isProduction: false,
          notes: "Placeholder — replace with the real staging URL(s).",
        },
      },
    },
  });

  const moduleIds = {} as Record<ModuleCode, string>;
  for (const code of Object.keys(MODULE_LABELS) as ModuleCode[]) {
    const m = await db.module.upsert({
      where: { code },
      update: {},
      create: { code, name: MODULE_LABELS[code], description: MODULE_DESCRIPTIONS[code] },
    });
    moduleIds[code] = m.id;
  }

  const processIds: Record<string, string> = {};
  for (const p of PROCESSES) {
    const input = processInput.parse({ moduleId: moduleIds[p.module], name: p.name, description: p.description, steps: p.steps });
    const row = await db.businessProcess.upsert({ where: { name: p.name }, update: {}, create: input });
    processIds[p.name] = row.id;
  }

  let created = 0;
  for (const r of RISKS) {
    if (await db.risk.findFirst({ where: { title: r.title } })) continue;
    const input = riskInput.parse({
      moduleId: moduleIds[r.module],
      processId: r.process ? processIds[r.process] : null,
      title: r.title,
      characteristic: r.characteristic,
      likelihood: r.l,
      impact: r.i,
      mitigation: r.mitigation,
    });
    await db.risk.create({ data: { ...input, score: riskScore(input.likelihood, input.impact) } });
    created++;
  }

  // The ERP module directory is loaded once; after that admins own it in Team & modules.
  let areasLoaded = false;
  if ((await db.erpArea.count()) === 0) {
    await importAreas(db, JSON.parse(readFileSync(path.join(process.cwd(), "data", "erp-areas.json"), "utf8")));
    areasLoaded = true;
  }

  const counts = await Promise.all([db.project.count(), db.environment.count(), db.module.count(), db.businessProcess.count(), db.risk.count(), db.erpArea.count()]);
  console.log(
    `Seeded. projects=${counts[0]} environments=${counts[1]} modules=${counts[2]} processes=${counts[3]} risks=${counts[4]} (new risks: ${created}) erpAreas=${counts[5]}${areasLoaded ? " (loaded from data/erp-areas.json)" : ""}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
