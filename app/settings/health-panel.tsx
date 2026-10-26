"use client";

import { useState, useTransition } from "react";
import { CloudIcon, CpuIcon, RefreshCwIcon } from "lucide-react";
import { InlineAlert } from "@/components/inline-alert";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { refreshHealth, testProvider, type HealthSnapshot, type TestResult } from "./actions";

export function HealthPanel({ initial }: { initial: HealthSnapshot }) {
  const [health, setHealth] = useState(initial);
  const [checking, startCheck] = useTransition();
  const [testing, setTesting] = useState<"local" | "cloud" | null>(null);
  const [results, setResults] = useState<Partial<Record<"local" | "cloud", TestResult>>>({});
  const { ollama, anthropicKey } = health;

  const run = async (kind: "local" | "cloud") => {
    setTesting(kind);
    try {
      const r = await testProvider(kind);
      setResults((s) => ({ ...s, [kind]: r }));
    } finally {
      setTesting(null);
    }
  };

  const localTone = !ollama.reachable ? "bad" : ollama.modelPresent ? "ok" : "warn";
  const localLabel = !ollama.reachable ? "Not reachable" : ollama.modelPresent ? "Ready" : "Model missing";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-[9px] bg-acc-t text-acc" aria-hidden>
              <CpuIcon className="size-[18px]" />
            </span>
            Local model (Ollama)
          </CardTitle>
          <CardDescription>Handles every sensitive task. Never falls back to the cloud.</CardDescription>
          <CardAction>
            <StatusPill tone={localTone}>{localLabel}</StatusPill>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3">
          <dl className="grid grid-cols-[90px_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Address</dt>
            <dd className="truncate font-mono text-[13px]">{ollama.baseURL}</dd>
            <dt className="text-muted-foreground">Model</dt>
            <dd className="font-mono text-[13px]">{ollama.model}</dd>
            {ollama.reachable ? (
              <>
                <dt className="text-muted-foreground">Installed</dt>
                <dd className="font-mono text-[13px]">{ollama.models.length ? ollama.models.join(", ") : "none"}</dd>
              </>
            ) : null}
          </dl>
          {ollama.error ? <InlineAlert tone={ollama.reachable ? "warn" : "bad"}>{ollama.error}</InlineAlert> : null}
          {results.local ? <InlineAlert tone={results.local.ok ? "ok" : "bad"} role="status">{results.local.message}</InlineAlert> : null}
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" disabled={testing !== null} onClick={() => run("local")}>
            {testing === "local" ? "Testing…" : "Test local model"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-[9px] bg-acc-t text-acc" aria-hidden>
              <CloudIcon className="size-[18px]" />
            </span>
            Cloud model (Claude)
          </CardTitle>
          <CardDescription>Test design and code generation. Sensitive input is redacted first or refused.</CardDescription>
          <CardAction>
            <StatusPill tone={anthropicKey ? "ok" : "bad"}>{anthropicKey ? "Key set" : "No API key"}</StatusPill>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3">
          <dl className="grid grid-cols-[90px_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">API key</dt>
            <dd className="font-mono text-[13px]">{anthropicKey ? "ANTHROPIC_API_KEY ••••••••" : "not set"}</dd>
            <dt className="text-muted-foreground">Logged</dt>
            <dd className="text-[13.5px]">Every call: task, model, tokens, cost. Never the prompt text.</dd>
          </dl>
          {!anthropicKey ? (
            <InlineAlert tone="info">Add an IT/DPO-approved key as ANTHROPIC_API_KEY in .env.local, then restart the dev server.</InlineAlert>
          ) : null}
          {results.cloud ? <InlineAlert tone={results.cloud.ok ? "ok" : "bad"} role="status">{results.cloud.message}</InlineAlert> : null}
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" disabled={testing !== null} onClick={() => run("cloud")}>
            {testing === "cloud" ? "Testing…" : "Test cloud model"}
          </Button>
        </CardFooter>
      </Card>

      <div className="lg:col-span-2">
        <Button variant="ghost" size="sm" disabled={checking} onClick={() => startCheck(async () => setHealth(await refreshHealth()))}>
          <RefreshCwIcon className={checking ? "animate-spin" : undefined} /> {checking ? "Checking…" : "Re-check providers"}
        </Button>
      </div>
    </div>
  );
}
