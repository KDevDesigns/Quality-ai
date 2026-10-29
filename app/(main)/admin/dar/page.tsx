import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAction } from "@/lib/auth/session";
import { darStore } from "@/lib/dar/store";
import { db } from "@/lib/db";
import { DarTemplateForm } from "./template-form";

export const metadata: Metadata = { title: "DAR template" };

const dar = darStore(db);

export default function DarTemplatePage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <DarTemplateBody />
    </Suspense>
  );
}

async function DarTemplateBody() {
  await connection();
  await requireAction("dar.template");
  const template = await dar.template();
  return (
    <>
      <PageHeader
        title="DAR template"
        description="The fixed text on every QA tester's Daily Accomplishment Report. Testers can change their own name, position and duties under My DAR → My details; everything else comes from here."
      />
      <Card>
        <CardContent>
          <DarTemplateForm template={template} />
        </CardContent>
      </Card>
    </>
  );
}
