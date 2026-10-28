import { Suspense } from "react";
import { LoadingBlock } from "@/components/page-header";
import { requireAiWorkbench } from "@/lib/workspace";

// The AI workbench is hidden unless an admin switches it on in Admin → Workspace.
// Each page and action below repeats the check, since a layout doesn't re-run on client navigation.

export default function AiWorkbenchLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  await requireAiWorkbench();
  return children;
}
