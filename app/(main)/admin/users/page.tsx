import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { UsersIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { requireAction } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ResetPasswordButton, UserDialog } from "./user-dialog";

export const metadata: Metadata = { title: "Users" };

export default function UsersPage() {
  // The header sits inside the guarded component so non-admins never see the page frame.
  return (
    <Suspense fallback={<LoadingBlock />}>
      <UsersBody />
    </Suspense>
  );
}

async function UsersBody() {
  await connection();
  const me = await requireAction("users.manage");
  const users = await db.user.findMany({
    orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      mustChangePassword: true,
      areas: { select: { isLead: true, area: { select: { name: true, parent: { select: { name: true } } } } } },
    },
  });

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone who can sign in. New accounts get a one-time temporary password that must be changed at first sign-in."
        actions={<UserDialog />}
      />
      {users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users yet" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Modules</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className={u.active ? undefined : "opacity-60"}>
                  <TableCell className="font-semibold">
                    {u.name}
                    {u.id === me.id ? <span className="ml-1.5 text-[12.5px] font-normal text-muted-foreground">(you)</span> : null}
                  </TableCell>
                  <TableCell className="font-mono text-[13px]">{u.email}</TableCell>
                  <TableCell><Badge variant="outline">{ROLE_LABELS[u.role as Role]}</Badge></TableCell>
                  <TableCell className="max-w-xs whitespace-normal text-[13px] text-ink2">
                    {u.areas.length ? (
                      u.areas.map((a) => `${a.area.parent ? `${a.area.parent.name} › ` : ""}${a.area.name}${a.isLead ? " (lead)" : ""}`).join(", ")
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!u.active ? (
                      <StatusPill tone="neutral">Turned off</StatusPill>
                    ) : u.mustChangePassword ? (
                      <StatusPill tone="warn">Temporary password</StatusPill>
                    ) : (
                      <StatusPill tone="ok">Active</StatusPill>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <UserDialog user={{ id: u.id, name: u.name, email: u.email, role: u.role as Role, active: u.active }} isSelf={u.id === me.id} />
                      {u.id !== me.id ? <ResetPasswordButton id={u.id} name={u.name} /> : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
