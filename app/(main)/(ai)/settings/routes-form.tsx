"use client";

import { useActionState } from "react";
import { LockIcon } from "lucide-react";
import { nativeSelectClass } from "@/components/form-field";
import { InlineAlert } from "@/components/inline-alert";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { initialFormState } from "@/lib/form";
import { cn } from "@/lib/utils";
import { saveRoutes } from "./actions";

export type RouteRow = { task: string; label: string; privacy: "localOnly" | "redactThenCloud" | "public"; defaultRoute: string; current: string };

const ROUTE_LABEL: Record<string, string> = {
  local: "Local model",
  "claude-sonnet-5-5": "Claude Sonnet 5.5",
  "claude-haiku-5-5": "Claude Haiku 5.5",
  "claude-opus-5-5": "Claude Opus 5.5",
};

const PRIVACY: Record<RouteRow["privacy"], string> = {
  localOnly: "Local only",
  redactThenCloud: "Redacted before cloud",
  public: "No sensitive input",
};

export function RoutesForm({ rows, routes }: { rows: RouteRow[]; routes: readonly string[] }) {
  const [state, action, pending] = useActionState(saveRoutes, initialFormState);
  return (
    <form action={action}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Privacy</TableHead>
            <TableHead className="w-64">Model</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.task}>
              <TableCell className="whitespace-normal">
                <div className="font-medium">{r.label}</div>
                <div className="font-mono text-xs text-muted-foreground">{r.task}</div>
              </TableCell>
              <TableCell className="text-[13.5px] text-ink2">{PRIVACY[r.privacy]}</TableCell>
              <TableCell>
                {r.privacy === "localOnly" ? (
                  <span className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
                    <LockIcon className="size-3.5" aria-hidden /> Local model (locked)
                  </span>
                ) : (
                  <select
                    name={`route_${r.task}`}
                    aria-label={`Model for ${r.label}`}
                    defaultValue={r.current}
                    className={cn(nativeSelectClass, "h-10 text-sm")}
                  >
                    {routes.map((route) => (
                      <option key={route} value={route}>
                        {ROUTE_LABEL[route] ?? route}
                        {route === r.defaultRoute ? " (default)" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end gap-3 border-t border-line2 px-5 py-3.5">
        {state.message ? <InlineAlert tone={state.ok ? "ok" : "bad"} role="status" className="mr-auto py-2">{state.message}</InlineAlert> : null}
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save models"}</Button>
      </div>
    </form>
  );
}
