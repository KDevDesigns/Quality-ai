"use client";

import { useState, useTransition } from "react";
import { InlineAlert } from "@/components/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GuardResult } from "@/lib/guard/allowlist";
import { checkUrl } from "./actions";

export function UrlTester({ envId }: { envId: string }) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<GuardResult | null>(null);
  const [pending, startTransition] = useTransition();
  const inputId = `test-url-${envId}`;

  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => setResult(await checkUrl(envId, url)));
      }}
    >
      <label htmlFor={inputId} className="text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">
        Test a URL against this allowlist
      </label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setResult(null);
          }}
          placeholder="https://…"
          className="h-10 font-mono text-[13px]"
        />
        <Button type="submit" variant="outline" disabled={pending || !url.trim()}>Check</Button>
      </div>
      {result ? (
        <InlineAlert tone={result.ok ? "ok" : "bad"} role="status">
          {result.ok ? "Allowed: the runner may visit this URL." : `Blocked: ${result.reason}`}
        </InlineAlert>
      ) : null}
    </form>
  );
}
