import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { UsersRoundIcon } from "lucide-react";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/empty-state";
import { nativeSelectClass } from "@/components/form-field";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildTree } from "@/lib/areas/tree";
import { can, ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { requireAction } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { deleteArea } from "./actions";
import { AreaDialog, MembersDialog, type AreaValues, type PersonOption } from "./team-dialogs";

export const metadata: Metadata = { title: "Team & modules" };

type SearchParams = Record<string, string | string[] | undefined>;
type Member = { userId: string; name: string; role: Role; isLead: boolean };

export default function TeamPage({ searchParams }: PageProps<"/team">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <TeamBody searchParams={searchParams} />
    </Suspense>
  );
}

async function TeamBody({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  await connection();
  const me = await requireAction("team.view");
  const admin = can(me, "areas.manage");
  const person = typeof sp.person === "string" ? sp.person : "";

  const [areas, users] = await Promise.all([
    db.erpArea.findMany({
      select: {
        id: true,
        parentId: true,
        name: true,
        code: true,
        sortOrder: true,
        active: true,
        members: { where: { user: { active: true } }, select: { isLead: true, user: { select: { id: true, name: true, role: true } } } },
      },
    }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, role: true } }),
  ]);

  const people: PersonOption[] = users.map((u) => ({ id: u.id, name: u.name, role: u.role as Role }));
  const rows = areas
    .filter((a) => admin || a.active)
    .map((a) => ({
      ...a,
      members: a.members.map((m): Member => ({ userId: m.user.id, name: m.user.name, role: m.user.role as Role, isLead: m.isLead })),
    }));
  const tree = buildTree(rows).filter(
    (mod) => !person || mod.members.some((m) => m.userId === person) || mod.children.some((c) => c.members.some((m) => m.userId === person)),
  );
  const modules = rows.filter((a) => a.parentId === null).map((a) => ({ id: a.id, name: a.name }));
  const toValues = (a: (typeof rows)[number]): AreaValues => ({
    id: a.id,
    name: a.name,
    code: a.code,
    parentId: a.parentId,
    sortOrder: a.sortOrder,
    active: a.active,
  });
  const selectedPerson = users.find((u) => u.id === person);

  return (
    <>
      <PageHeader
        title="Team & modules"
        description="Who owns which part of the ERP. Use it to find the right developer before filing a ticket."
        actions={admin ? <AreaDialog modules={modules} /> : null}
      />

      <form action="/team" className="flex flex-wrap items-center gap-2">
        <label htmlFor="person" className="text-sm text-muted-foreground">Show modules for</label>
        <select id="person" name="person" defaultValue={person} className={cn(nativeSelectClass, "h-9 w-64 text-sm")}>
          <option value="">Everyone</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name} · {ROLE_LABELS[u.role as Role]}</option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">Show</Button>
        {person ? <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/team" />}>Clear</Button> : null}
      </form>

      {tree.length === 0 ? (
        <EmptyState icon={UsersRoundIcon} title={person ? `${selectedPerson?.name ?? "This person"} isn't in any module yet` : "No modules yet"} action={admin && !person ? <AreaDialog modules={modules} /> : null}>
          {person ? "An admin can add them from the module's Members button." : admin ? "Add the ERP's modules, then their sub-modules, then assign developers and QA to each." : "An admin hasn't set up the module list yet."}
        </EmptyState>
      ) : (
        tree.map((mod) => (
          <Card key={mod.id} className={cn(!mod.active && "opacity-60")}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {mod.name}
                {mod.code ? <Badge variant="outline" className="font-mono">{mod.code}</Badge> : null}
                {!mod.active ? <StatusPill tone="neutral">Hidden</StatusPill> : null}
              </CardTitle>
              <CardDescription>
                {mod.children.length} sub-module{mod.children.length === 1 ? "" : "s"}
              </CardDescription>
              {admin ? (
                <CardAction className="flex gap-0.5">
                  <AreaDialog modules={modules} parentId={mod.id} />
                  <MembersDialog areaId={mod.id} areaName={mod.name} people={people} members={mod.members} />
                  <AreaDialog modules={modules} area={toValues(mod)} />
                  <DeleteButton id={mod.id} label={mod.name} action={deleteArea} detail="Its member list is removed too. This cannot be undone." />
                </CardAction>
              ) : null}
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[28%]">Area</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Developers</TableHead>
                  <TableHead>QA</TableHead>
                  {admin ? <TableHead className="w-28"><span className="sr-only">Actions</span></TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                <AreaRow label="Whole module" muted members={mod.members} person={person} admin={admin} />
                {mod.children.map((sub) => (
                  <AreaRow
                    key={sub.id}
                    label={sub.name}
                    code={sub.code}
                    hidden={!sub.active}
                    members={sub.members}
                    person={person}
                    admin={admin}
                    actions={
                      <>
                        <MembersDialog areaId={sub.id} areaName={`${mod.name} › ${sub.name}`} people={people} members={sub.members} />
                        <AreaDialog modules={modules} area={toValues(sub)} />
                        <DeleteButton id={sub.id} label={sub.name} action={deleteArea} detail="Its member list is removed too. This cannot be undone." />
                      </>
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        ))
      )}
    </>
  );
}

function AreaRow({
  label,
  code,
  muted,
  hidden,
  members,
  person,
  admin,
  actions,
}: {
  label: string;
  code?: string | null;
  muted?: boolean;
  hidden?: boolean;
  members: Member[];
  person: string;
  admin: boolean;
  actions?: React.ReactNode;
}) {
  const lead = members.filter((m) => m.isLead);
  const devs = members.filter((m) => !m.isLead && m.role !== "QA");
  const qa = members.filter((m) => !m.isLead && m.role === "QA");
  return (
    <TableRow className={cn(hidden && "opacity-60")}>
      <TableCell className={cn("whitespace-normal", muted ? "text-muted-foreground italic" : "font-medium")}>
        {label}
        {code ? <span className="ml-2 font-mono text-[12px] text-muted-foreground">{code}</span> : null}
        {hidden ? <span className="ml-2 text-[12px] text-muted-foreground">(hidden)</span> : null}
      </TableCell>
      <TableCell className="whitespace-normal"><People list={lead} person={person} /></TableCell>
      <TableCell className="whitespace-normal"><People list={devs} person={person} /></TableCell>
      <TableCell className="whitespace-normal"><People list={qa} person={person} /></TableCell>
      {admin ? <TableCell><div className="flex justify-end gap-0.5">{actions}</div></TableCell> : null}
    </TableRow>
  );
}

function People({ list, person }: { list: Member[]; person: string }) {
  if (list.length === 0) return <span className="text-[13px] text-muted-foreground">—</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {list.map((m) => (
        <span
          key={m.userId}
          className={cn("rounded-md px-2 py-0.5 text-[13px]", m.userId === person ? "bg-acc text-primary-foreground" : "bg-surface3 text-foreground")}
        >
          {m.name}
        </span>
      ))}
    </span>
  );
}
