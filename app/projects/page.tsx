import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { FolderKanbanIcon } from "lucide-react";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/empty-state";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { deleteProject } from "./actions";
import { ProjectDialog } from "./project-dialog";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Projects"
        description="A project groups the environments you test."
        actions={<ProjectDialog />}
      />
      <Suspense fallback={<LoadingBlock />}>
        <ProjectsTable />
      </Suspense>
    </>
  );
}

async function ProjectsTable() {
  await connection();
  const projects = await db.project.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { environments: true } } },
  });

  if (projects.length === 0) {
    return (
      <EmptyState icon={FolderKanbanIcon} title="No projects yet" action={<ProjectDialog />}>
        Create a project, then add the staging environments it targets.
      </EmptyState>
    );
  }

  return (
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
  );
}
