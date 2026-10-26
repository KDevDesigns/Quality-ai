import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { ModuleDialog } from "./module-dialog";

export const metadata: Metadata = { title: "Modules" };

export default function ModulesPage() {
  return (
    <>
      <PageHeader title="Modules" description="The four ERP modules under test. The set is fixed; only descriptions can be edited." />
      <Suspense fallback={<LoadingBlock />}>
        <ModulesTable />
      </Suspense>
    </>
  );
}

async function ModulesTable() {
  await connection();
  const modules = await db.module.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { processes: true, risks: true } } },
  });

  if (modules.length === 0) {
    return <p className="text-sm text-muted-foreground">No modules found. Run <code className="font-mono">npm run db:seed</code>.</p>;
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Processes</TableHead>
            <TableHead className="text-right">Risks</TableHead>
            <TableHead className="w-14"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.map((m) => (
            <TableRow key={m.id}>
              <TableCell><Badge variant="outline">{m.code}</Badge></TableCell>
              <TableCell className="font-semibold">{m.name}</TableCell>
              <TableCell className="max-w-md whitespace-normal text-muted-foreground">{m.description}</TableCell>
              <TableCell className="text-right font-mono">{m._count.processes}</TableCell>
              <TableCell className="text-right font-mono">{m._count.risks}</TableCell>
              <TableCell><ModuleDialog mod={{ id: m.id, name: m.name, description: m.description }} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
