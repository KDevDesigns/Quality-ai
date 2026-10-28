import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { FolderKanbanIcon } from "lucide-react";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/empty-state";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAction } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteProject } from "./actions";
import { ProjectDialog } from "./project-dialog";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  // The header sits inside the guarded component so non-admins never see the page frame.
  return (
    <Suspense fallback={<LoadingBlock />}>
      <ProjectsTable />
    </Suspense>
  );
}

async function ProjectsTable() {
  await connection();
  await requireAction("projects.manage");
  const projects = await db.project.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { environments: true } } },
  });

  const header = <PageHeader title="Projects" description="The ERP systems you test and file tickets against." actions={<ProjectDialog />} />;

  if (projects.length === 0) {
    return (
      <>
        {header}
        <EmptyState icon={FolderKanbanIcon} title="No projects yet" action={<ProjectDialog />}>
          Create a project, then add the staging environments it targets.
        </EmptyState>
      </>
    );
  }

  return (
    <>
      {header}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Environments</TableHead>
              <TableHead className="w-24"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-semibold">{p.name}</TableCell>
                <TableCell className="max-w-md truncate text-muted-foreground">{p.description}</TableCell>
                <TableCell className="text-right font-mono">{p._count.environments}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-0.5">
                    <ProjectDialog project={{ id: p.id, name: p.name, description: p.description }} />
                    <DeleteButton
                      id={p.id}
                      label={p.name}
                      action={deleteProject}
                      detail={`This also deletes its ${p._count.environments} environment${p._count.environments === 1 ? "" : "s"}. This cannot be undone.`}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
