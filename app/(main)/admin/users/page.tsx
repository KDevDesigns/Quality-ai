import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { KeyRoundIcon, UserPlusIcon, UsersIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { requireAction } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDateTime, timeAgo } from "@/lib/format";
import { ApprovalHost, PendingActions, ResetRequestActions } from "./pending-actions";
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
  const requests = await db.user.findMany({
    where: { pending: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  const resets = await db.user.findMany({
    where: { pending: false, resetRequestedAt: { not: null } },
    orderBy: { resetRequestedAt: "asc" },
    select: { id: true, name: true, email: true, role: true, active: true, resetRequestedAt: true },
  });
  const users = await db.user.findMany({
    where: { pending: false },
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
    <ApprovalHost>
      <PageHeader
        title="Users"
        description="Everyone who can sign in. People can request an account on the sign-in page; accounts you add here get a one-time temporary password."
        actions={<UserDialog />}
      />
      {requests.length ? (
        <Card className="border-warn-b">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlusIcon className="size-4 text-warn-ink" aria-hidden /> Waiting for approval
              <span className="rounded-full bg-warn-t px-2 text-[12.5px] font-semibold text-warn-ink">{requests.length}</span>
            </CardTitle>
            <CardDescription>They signed up on the sign-in page. Check that each one is really on the team before approving: approved users can see every ticket.</CardDescription>
          </CardHeader>
          <Table>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold">{r.name}</TableCell>
                  <TableCell className="font-mono text-[13px]">{r.email}</TableCell>
                  <TableCell><Badge variant="outline">{ROLE_LABELS[r.role as Role]}</Badge></TableCell>
                  <TableCell className="text-[13px] text-muted-foreground" title={formatDateTime(r.createdAt)}>{timeAgo(r.createdAt)}</TableCell>
                  <TableCell><PendingActions id={r.id} name={r.name} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : null}
      {resets.length ? (
        <Card className="border-warn-b">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRoundIcon className="size-4 text-warn-ink" aria-hidden /> Password reset requests
              <span className="rounded-full bg-warn-t px-2 text-[12.5px] font-semibold text-warn-ink">{resets.length}</span>
            </CardTitle>
            <CardDescription>They used &ldquo;Forgot your password?&rdquo; on the sign-in page. Reset gives you a temporary password to hand over in person; check it&apos;s really them first.</CardDescription>
          </CardHeader>
          <Table>
            <TableBody>
              {resets.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold">{r.name}</TableCell>
                  <TableCell className="font-mono text-[13px]">{r.email}</TableCell>
                  <TableCell><Badge variant="outline">{ROLE_LABELS[r.role as Role]}</Badge></TableCell>
                  <TableCell className="text-[13px] text-muted-foreground" title={formatDateTime(r.resetRequestedAt!)}>{timeAgo(r.resetRequestedAt!)}</TableCell>
                  <TableCell><ResetRequestActions id={r.id} name={r.name} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : null}
      {users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users yet" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nickname</TableHead>
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
    </ApprovalHost>
  );
}
