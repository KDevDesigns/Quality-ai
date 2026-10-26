# DCWD CSMS BCA API process flow

## Slide 1 — Executive view

`dcwd_apps-csms-bca-api` is the back-end operating layer for DCWD customer-service and billing work. It is a .NET 8 modular monolith that combines billing, collection, job management, meter-reading, new-service connection, cloud synchronization, reports, and reference-data administration in one API host.

The practical system-of-record flow is:

```text
Source systems / field staff / customer channels
        ↓
ERP BCA API: validation, workflow state, audit trail, orchestration
        ↓
PostgreSQL operational data + Cloud PostgreSQL replicas
        ↓
BCS, CRM tickets, payment services, HR, GIS, SFTP, SMS/email, object storage
```

The active implementation baseline should be the `development` branch, not `main`. `main` is 622 commits behind `development` as of 2026-10-23.

## Slide 2 — Review scope and repository health

- Repository mirror reviewed: 77 branch heads, 72 unique head commits, 2,248 reachable commits.
- Active `development` tree: 2,873 files, including 2,748 C# files, 152 controllers and 686 declared HTTP actions.
- 47 branches are already contained in `development`.
- 30 heads diverge from `development`; most are historical cloud/e-billing lines from March–August 2026.
- Current nearline branches are `dev_api5` and `development-search-update`, each nine commits ahead of `development`; their tip is dated 2026-10-23. `mr-job-assignment` is one commit ahead but 68 commits behind.
- The local machine has no .NET SDK, so compilation and test execution were not possible. The solution does contain a substantial xUnit test suite, especially for NSC, MCR, JMS, billing reports, BAM, and meter-reader rules.

## Slide 3 — Runtime architecture

Two web hosts share the domain and service layers:

| Host | Responsibility |
| --- | --- |
| `API` | On-premise billing/collection host, base path `/dcwd-erp-billing-collection`; exposes the main operational API, SignalR hubs, background Quartz jobs, and health checks. |
| `API.Cloud` | Cloud-facing host using the cloud data context for cloud customer, billing, account, ticket, and lookup scenarios. |

Both use ASP.NET Core, API versioning, Swagger, JWT/API-key authentication, Entity Framework Core, and PostgreSQL. The on-premise host also runs the in-process queue consumer and Quartz jobs.

Primary persistence and integration boundaries:

- `DataContext` / PostgreSQL: operational billing, collection, JMS, meter reading, NSC, identity, lookup, audit, and seeding state.
- `CloudDataContext` / PostgreSQL: cloud customer, bill, transaction, enrolled account, social-account, and ticket replicas.
- Legacy MySQL and SFTP: source inputs for selected seed/import processes.
- External services: BCS, NSC Pay, CRM ticket API, HR, GIS, DigitalOcean Spaces, Redis, SMART SMS, and Mailjet email.

## Slide 4 — Functional map

| Domain | Main purpose | Notable implementation surface |
| --- | --- | --- |
| Billing | bills, rates, adjustments, penalties, order of payment, debit/credit memo, reports | 25 controllers; calculation, posting and reconciliation rules |
| Collection | teller and office/bank/non-water collection operations | office collection, CR/teller master data, NSC payment bridge |
| JMS | customer job/maintenance lifecycle and configurable process sequencing | 17 controllers; requirements, maintenance orders, MCR, notifications, logs |
| Meter reading | field-book assignment, mobile reader workflow, upload/review/verification | scheduler, download, reader auth/assignment/upload/backup/review |
| NSC | new-service-connection application lifecycle | customer intake, verification, investigation, waiver, payment, contract, install, BCS export |
| Integration and seeding | data ingestion and cloud replication | monitored manual launches plus ordered nightly pipeline |
| Lookups, HR, investigation and reports | shared master data, staff context, operational inquiry | 35 lookup controllers plus HR/investigation endpoints |

## Slide 5 — Master data and ingestion process

The system keeps operational screens supplied through configurable lookup records and a monitored seeding mechanism.

```text
SFTP / legacy DB / cloud sources
  → durable Quartz job or manual launch
  → source-specific seeder and validation
  → PostgreSQL operational or cloud tables
  → run history, counters, watermark, failure alert
  → seed monitor and downstream consumers
```

The nightly ordered pipeline is data-driven through `seed_schedules`:

1. Latest BCS customer import
2. Latest BCS customer transactions
3. Latest BCS billing
4. Customer update
5. Customer-transaction refresh
6. Cloud customers
7. Cloud transactions
8. Cloud billings

Failures retry every 15 minutes; a successful manual run can continue the chain. Meter reading, rate, meter-rate, and legacy meter-change imports are deliberately manual because the user supplies the relevant file/rate context.

## Slide 6 — Billing and collection process

```text
Customer and meter/rate data
  → meter reading / billing schedule
  → bill calculation and current-bill posting
  → customer inquiry and bill history
  → payment or adjustment route
       ├─ water/non-water office or bank collection
       ├─ Order of Payment (pending → paid)
       ├─ Billing Adjustment Memo
       └─ Debit/Credit Memo
  → ledger/customer balances, transaction history, daily and billing reports
```

Key controls implemented in code:

- Order-of-payment creation validates amount, type/COA, customer, and any JMS sequence prerequisite; it generates a reference number and starts as `Pending`.
- The paid-order sweep runs every two minutes to record payment progress in JMS and release any newly eligible automatic process.
- Debit/credit memos and BAMs have explicit validation, approval and posting stages; posting is the point at which accounting/customer balances are changed.
- Billing reports support period-sheet and daily-report variants, including marginal postings, meter change, credit memo, and billing summaries.

## Slide 7 — Meter-reading field-to-bill workflow

```text
Billing schedule
  → scheduler creates/assigns meter-reader books
  → reader authenticates on the allowed office network
  → reader downloads assigned book
  → mobile capture: readings, remarks, photos and manifest
  → transactional upload completion
  → supervisor review and reasoned corrections
  → verification / downstream billing use
```

Book states are `To Do → For Download → Downloaded → In Progress → Complete → For Review → Verified`. A reader record is classified as `NotUploaded`, `Read`, `Unreadable`, `Missed`, or `NotRequired`.

The scheduler uses conditional updates to prevent conflicting admin/phone status writes. Upload completion compares the phone manifest with stored records in one transaction; review writes separate edit records with reasons. SignalR publishes meter-reading upload events to the administration UI.

## Slide 8 — JMS service-job workflow

JMS is a configurable workflow engine for maintenance/service work, not only a ticket list.

```text
CRM ticket or direct request
  → create JMS and code-specific process sequence
  → requirements gate
  → maintenance-order dispatch / field investigation
  → payment or adjustment work, as configured
  → MCR and/or automatic posting
  → customer notification, ticket update, job completion
```

Each JMS code can define ordered processes, stages, assigned employees, charges, document requirements, automatic posting, and customer notifications. The sequence gate prevents creation or completion of a later process while prerequisite work remains open. A unified JMS log and SignalR hub provide the live timeline.

JMS lifecycle states include `Pending`, `Assigned`, `Downloaded`, `InvestigationComplete`, `OrderOfPayment`, `BAM`, `DM`, `CM`, `MCR`, `ContractSigning`, `Completed`, and `Void`.

## Slide 9 — MCR control flow

MCR is a controlled change mechanism. It does not alter the customer record at approval; only posting applies the approved change.

```text
Draft
  → Submit
  → Validate or Return
  → Approve
  → Post to customer record
      ├─ complete/advance JMS work
      ├─ run configured follow-up or marginal-billing work
      └─ queue notifications and update source CRM ticket where applicable
```

The persisted states are `Draft`, `Submitted`, `Returned`, `Validated`, `Approved`, `Posted`, and `Void`. A post re-runs readiness checks because payment, meter, contract, or assignment conditions can change between approval and posting. A failed post returns the item to an actionable state rather than applying a partial customer update.

## Slide 10 — NSC customer application flow

NSC is the end-to-end new-service-connection workflow with customer and staff endpoints, files, status history, queues, reports, notifications, and BCS reconciliation.

```text
Customer portal or CSA/walk-in intake
  → duplicate/location checks and requirements
  → requirements verification / endorsement
  → field investigation
      ├─ re-investigation
      ├─ disqualification
      ├─ waiver review
      └─ payment verification
  → contract signing
  → installation assignment, field details and completion
  → BCS export queue
  → BCS reconciliation returns account number
```

Application statuses are `PreVerified`, `Submitted`, `ForRequirementsVerification`, `Investigation`, `WaiverPending`, `PaymentVerification`, `ContractSigning`, `InstallationPending`, `Completed`, `Cancelled`, `Disqualified`, `Archived`, and `PendingReinvestigation`.

The latest source wires forward transitions: investigation findings/waiver outcome can move an application to payment, payment verification moves it to contract signing, contract approval moves it to installation, and installation completion moves it to completed. Every valid application transition writes a status-history record in the same save.

## Slide 11 — NSC operational automation and safeguards

- Requirements and evidence: allowed file types are PDF/JPG/JPEG/PNG/HEIC; individual files are limited to 10 MB and a submission to 60 MB. Object-storage links are pre-signed.
- Concurrency: application, investigation, installation, payment, contract, and BCS export records use PostgreSQL `xmin` version checking.
- Export: NSC queues a BCS export; BCS collects it and calls the reconciliation endpoint with the account number. It is an API queue, not a file export.
- Operations: the export sweep runs at 03:00; notification scanning is every 15 minutes, dispatch every 5 minutes, deadline reminders daily, report generation every 10 minutes, and legacy-migration processing every 5 minutes.
- Migration: legacy MySQL is read-only; 13 domains are migrated in ordered steps, dry-run is the default, and rollback is restricted by age and lack of later workflow activity.

## Slide 12 — Security and operational risks to present plainly

1. **Branch selection risk:** `main` is materially stale. Deploying from it would omit the current NSC, MCR, meter-reading, JMS, report, and seeding work. Establish and protect a release branch from the validated `development`/nearline merge point.
2. **Authorization risk:** the NSC implementation includes permission models, but the documented audit and source comments show key NSC staff/admin actions have historically relied on authenticated-user access or UI gating rather than complete server-side policy enforcement. Verify and enforce policies before broad production exposure.
3. **Single-process scheduler risk:** Quartz jobs run in the API process. Scaling the host without a cluster-safe scheduler/lock strategy risks duplicate execution; recycling the host interrupts in-process work.
4. **Integration resilience risk:** several business processes depend on SFTP, BCS, CRM, payment, SMS/email, HR, GIS and object storage. The design has retries, queues, history and failure alerts, but should have operational ownership and reconciliation dashboards per dependency.
5. **Build assurance gap:** this review environment lacked the .NET SDK, so the test suite was inspected but not executed here.

## Slide 13 — Recommended operating model

| Cadence | Owner focus | Evidence to review |
| --- | --- | --- |
| Daily | Billing/collection operations | seed monitor, failed imports, current-bill posting, payment sweep exceptions |
| Daily | Field operations | meter-reader book completion/review backlog, JMS dispatch and stuck process sequence |
| Daily | NSC operations | status aging, requirements/investigation/payment/installation queues, export reconciliation failures |
| Weekly | Application owner | branch/release decision, failed job history, integration errors, role-assignment audit |
| Per release | Engineering + QA | merge nearline branches intentionally, build/test with .NET 8, database migration review, workflow and authorization regression checks |

## Slide 14 — Suggested presentation close

The API has evolved into a workflow-centered operational platform. Its strongest design pattern is consistent across modules: validate a command, guard its stage/sequence, persist the business record and audit/log entry together, then let queues and scheduled workers perform reconciliation and notification work.

The next management decision is not whether the platform has functionality—it clearly does—but how to operate it safely: select a single release baseline, complete server-side authorization, make scheduler/integration ownership explicit, and treat workflow queues and reconciliation results as first-class daily controls.

## Appendix — Evidence locations

- Host composition and pipeline: `API/Program.cs`, `API/ConfigureServices.cs`, `Background.Services/ConfigureServices.cs`.
- Scheduler and job cadence: `Background.Services/QuartzServices/QuartzServicesConfiguration.cs`.
- Billing/collection: `Services.Billings/Implementations`, `Services.Collection/Implementations`.
- Meter reading: `Services.Billings/Implementations/MR`, `Common/Helpers/MeterReader*`.
- JMS/MCR: `Services.JMS/Implementations`, `Services.Billings/Implementations/JmsAutoPostService.cs`, `Services.JMS/Implementations/McrTransactionService.cs`.
- NSC: `API/Controllers/Main/NSC`, `Services.NSC`, `Common/Helpers/NscStatusTransitions.cs`, `Services.NSC/Helpers/NscApplicationStatusMove.cs`.
- Detailed NSC implementation audit: `docs/nsc/NSC-SYSTEM-SPEC.md`. It is a useful historical audit, but the current `development` source should take precedence where newer October commits changed behavior.
