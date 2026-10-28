import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BugIcon, MessagesSquareIcon, PenToolIcon } from "lucide-react";
import { LoadingBlock } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

// Layout and brand pane follow the DCWD Careers sign-in screen: brand pane left (800 of 1920 px), form right, footer bar.

const CHIPS = [
  { icon: BugIcon, label: "Report a bug" },
  { icon: PenToolIcon, label: "Mark up screenshots" },
  { icon: MessagesSquareIcon, label: "Talk it through" },
];

const WAVES = [
  { cls: "w1", d: "M0 104 Q 200 54 400 104 T 800 104 T 1200 104 T 1600 104 V220 H0 Z", fill: "#e2e8fb" },
  { cls: "w2", d: "M0 146 Q 200 112 400 146 T 800 146 T 1200 146 T 1600 146 V220 H0 Z", fill: "#d4ddf8" },
  { cls: "w3", d: "M0 184 Q 200 164 400 184 T 800 184 T 1200 184 T 1600 184 V220 H0 Z", fill: "#c7d2f5" },
];

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="flex min-h-screen bg-background">
      <BrandPane />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="flex flex-1 overflow-y-auto px-4 pt-12 pb-8">
          <div className="m-auto w-full max-w-[440px]">
            <MobileBrand />
            <Suspense fallback={<LoadingBlock />}>
              <LoginBody searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
        <footer className="flex min-h-[68px] shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-line2 px-6 py-3 text-[13px] text-muted-foreground md:px-16">
          <span>Need help signing in? Ask a QA Hub admin.</span>
          <span>Office network only · Davao City Water District</span>
        </footer>
      </div>
    </div>
  );
}

async function LoginBody({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  if (await getCurrentUser()) redirect("/");
  const next = (await searchParams).next;
  return <LoginForm next={typeof next === "string" ? next : "/"} />;
}

function BrandPane() {
  return (
    <section aria-label="QA Hub" className="auth-brand relative hidden w-[41.6%] max-w-[800px] shrink-0 overflow-hidden bg-[#eef2fd] text-[#1e2a78] lg:block">
      <div className="absolute left-1/2 top-[30.5%] size-[720px] -translate-1/2 rounded-full bg-[radial-gradient(circle,#ffffff_0,rgba(255,255,255,.7)_28%,rgba(255,255,255,0)_62%)]" />
      <div className="absolute left-1/2 top-[30.5%] size-0">
        {[
          [236, "#bcc6f1"],
          [330, "#cbd3f4"],
          [440, "#d8def7"],
          [570, "#e2e7f9"],
        ].map(([s, c]) => (
          <span key={s} className="rg" style={{ width: s, height: s, borderColor: c as string }} />
        ))}
        <span className="rip" />
        <span className="rip" />
        <span className="rip" />
        <span className="rip" />
      </div>
      <div className="seal absolute left-1/2 top-[30.5%] -mt-[90px] -ml-[90px] flex size-[180px] items-center justify-center rounded-full bg-white shadow-[0_18px_50px_rgba(40,52,140,.16),0_0_0_8px_rgba(255,255,255,.6)]">
        <Image src="/dcwd-seal.png" alt="Davao City Water District seal" width={140} height={140} priority />
      </div>
      <div className="auth-enter absolute inset-x-10 top-[46%] text-center xl:inset-x-20">
        <div className="text-[13px] font-semibold tracking-[0.16em] text-[#5b63c7] uppercase">Davao City Water District</div>
        <h1 className="mt-3.5 text-[44px] leading-[1.1] font-bold tracking-[-0.02em]">QA Hub</h1>
        <p className="mx-auto mt-4 max-w-[500px] text-[17px] leading-relaxed text-[#525a8c]">
          Report ERP bugs, suggestions and improvements with marked-up screenshots and videos, and talk them through with the developers who own each module.
        </p>
        <div className="mt-[30px] flex flex-wrap justify-center gap-2.5">
          {CHIPS.map(({ icon: Icon, label }) => (
            <span key={label} className="flex h-10 items-center gap-2 rounded-full border border-[#dde3f7] bg-white/75 px-4 text-[14.5px] font-medium text-[#2a3170]">
              <Icon className="size-4 text-[#4f56d3]" aria-hidden />
              {label}
            </span>
          ))}
        </div>
      </div>
      {WAVES.map((w) => (
        <div key={w.cls} className="absolute inset-x-0 bottom-0 h-[220px]" aria-hidden>
          <svg className={`wave ${w.cls}`} viewBox="0 0 1600 220" preserveAspectRatio="none">
            <path d={w.d} fill={w.fill} />
          </svg>
        </div>
      ))}
      <div className="absolute inset-x-0 bottom-[26px] text-center text-[13px] text-[#4a5290]">© Davao City Water District · Est. 1973</div>
    </section>
  );
}

/** Below the lg breakpoint the brand pane is hidden, so the form carries a small seal and name instead. */
function MobileBrand() {
  return (
    <div className="mb-8 flex items-center gap-3 lg:hidden">
      <Image src="/dcwd-seal.png" alt="" width={44} height={44} />
      <div>
        <div className="text-[11px] font-semibold tracking-[0.14em] text-acc uppercase">Davao City Water District</div>
        <div className="text-xl leading-tight font-bold text-brand">QA Hub</div>
      </div>
    </div>
  );
}
