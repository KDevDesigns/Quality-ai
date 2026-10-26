# ERP glossary

Terms used across the DCWD ERP and in QA AI prompts. Sources: `docs/PLAN.md` and `docs/erp/bca-api-process-flow.md`.
Keep entries short: this file is sent with every test-generation prompt.

## Billing & Collection
- **Account**: a customer's service account, identified by an account number. Sensitive.
- **Meter**: the installed water meter on an account, identified by a meter number. Sensitive.
- **Customer class**: tariff class of an account (for example residential, commercial). Rates come from the approved tariff data file.
- **Consumption**: current reading − previous reading, in m³.
- **Bill run**: generating bills for a zone or route in a billing period.
- **Penalty**: a surcharge applied after the due date, per policy.
- **OR**: Official Receipt. Issued per payment; OR numbers must be unique and gap-free per collector/series.
- **OP**: Order of Payment. Created with amount, type/COA, customer and any JMS prerequisite; gets a reference number. States: `Pending → Paid`.
- **BAM**: Billing Adjustment Memo. Validation → approval → posting; balances change only at posting.
- **DM / CM**: Debit Memo / Credit Memo. Same validate → approve → post stages as BAM.
- **COA**: Chart of Accounts.
- **Water / non-water collection**: payments for water bills vs other charges, at an office, teller or bank.
- **Current-bill posting**: making a calculated bill the account's current bill.
- **Marginal billing / posting**: an extra billing or posting outside the regular bill run (for example after a meter change).

## Meter reading
- **Book**: a set of accounts assigned to one meter reader. States:
  `To Do → For Download → Downloaded → In Progress → Complete → For Review → Verified`.
- **Reader record class**: `NotUploaded`, `Read`, `Unreadable`, `Missed`, `NotRequired`.
- **Upload completion**: the phone manifest is compared with stored records in one transaction.
- **Review edit**: a supervisor's correction, stored as a separate record with a reason.

## JMS (Job Management System)
- **JMS**: a service or maintenance job, often from a CRM ticket. Each JMS code defines an ordered process sequence.
- **Sequence gate**: a later process can't be created or completed while prerequisite work is open.
- **Lifecycle states**: `Pending`, `Assigned`, `Downloaded`, `InvestigationComplete`, `OrderOfPayment`, `BAM`, `DM`, `CM`, `MCR`,
  `ContractSigning`, `Completed`, `Void`.
- **Maintenance order**: a field dispatch created inside a JMS.

## MCR (customer record change)
- **MCR**: a controlled change to a customer record. Approval does not change the record; only **posting** applies it.
- **States**: `Draft → Submitted → (Returned | Validated) → Approved → Posted`, or `Void`.
- Posting re-runs readiness checks. A failed post returns the MCR to an actionable state with no partial update.

## NSC (New Service Connection)
- **NSC application**: a request for a new water connection, from the customer portal or a CSA/walk-in intake.
- **CSA**: Customer Service Assistant (staff intake).
- **Statuses**: `PreVerified`, `Submitted`, `ForRequirementsVerification`, `Investigation`, `WaiverPending`, `PaymentVerification`,
  `ContractSigning`, `InstallationPending`, `Completed`, `Cancelled`, `Disqualified`, `Archived`, `PendingReinvestigation`.
- **Status history**: every valid transition writes a history record in the same save.
- **Requirement files**: PDF/JPG/JPEG/PNG/HEIC, max 10 MB each and 60 MB per submission.
- **BCS export**: a completed installation is queued for BCS; BCS calls back with the new account number.

## Integrations
- **BCS**: the billing and customer system that is the source for customer, transaction and billing imports.
- **Seeding pipeline**: nightly ordered imports (BCS customers → transactions → billing → customer update → cloud replicas). Failures retry every 15 minutes.
- **CRM ticket**: a customer ticket that can start a JMS and is updated when work completes.

## Procurement & Inventory
- **PR / PO**: Purchase Request / Purchase Order. PR approval follows amount thresholds.
- **3-way match**: PO × receiving report × supplier invoice, within tolerance.
- **BAC**: Bids and Awards Committee.

## Finance & Accounting
- **DV**: Disbursement Voucher.
- **GL**: General Ledger. Every posting balances (debits = credits, to the centavo).
- **Subledger**: AR, AP, inventory or payroll-payable detail that must equal its GL control account.
- **Closed period**: an accounting period that rejects new postings.

## HR & Payroll
- **Gross-to-net**: gross pay − contributions (GSIS, PhilHealth, Pag-IBIG) − withholding tax = net pay. Rates come from data files.
- **Payslip privacy**: an employee sees only their own payslip.

## QA terms
- **Oracle**: code in `lib/oracles/` that computes expected amounts. Test cases never state computed money values.
- **Recon check**: a read-only SQL invariant in `lib/recon/` (for example balanced journals, no OR gaps).
