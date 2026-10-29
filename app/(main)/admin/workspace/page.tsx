import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAction } from "@/lib/auth/session";
import { getWorkspaceSettings } from "@/lib/workspace";
import { WorkspaceForm } from "./workspace-form";

export const metadata: Metadata = { title: "Workspace" };

export default function WorkspacePage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <WorkspaceBody />
    </Suspense>
  );
}

async function WorkspaceBody() {
  await connection();
  await requireAction("workspace.manage");
  const settings = await getWorkspaceSettings();

  return (
    <>
      <PageHeader title="Workspace" description="Settings that apply to everyone who uses QA Hub." />
      <Card>
        <CardHeader>
          <CardTitle>AI workbench</CardTitle>
          <CardDescription>
            Environments, processes, risk register, AI test design and AI settings. When on, it appears as a separate menu group for admins
            only. QA testers and developers never see it. Turning it off hides it again; nothing is deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceForm aiWorkbench={settings.aiWorkbench} />
        </CardContent>
      </Card>
    </>
  );
}
