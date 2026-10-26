"use client";

import { useState, useTransition } from "react";
import { LibraryBigIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form";
import { cn } from "@/lib/utils";
import { importSeedCatalog } from "./actions";

export function ImportCatalogButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<FormState | null>(null);
  return (
    <div className="flex items-center gap-3">
      <span aria-live="polite" className={cn("max-w-64 text-right text-[13px]", result?.ok ? "text-muted-foreground" : "text-bad")}>
        {result?.message}
      </span>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              setResult(await importSeedCatalog());
            } catch {
              setResult({ ok: false, message: "Import failed. Check data/seed-catalog.json." });
            }
          })
        }
      >
        <LibraryBigIcon /> {pending ? "Importing…" : "Import seed catalog"}
      </Button>
    </div>
  );
}
