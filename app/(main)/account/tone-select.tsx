"use client";

import { PlayIcon } from "lucide-react";
import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import { PRESET_TONES } from "@/lib/push/tones";
import { playTone } from "./device-push";

/** The notification sound list with a ▶ to hear the picked one. Shared by My account and the sign-in prompt. */
export function ToneSelect({ id, name, value, onChange }: { id: string; name?: string; value: string; onChange: (tone: string) => void }) {
  return (
    <div className="flex gap-2">
      <SelectField id={id} name={name} value={value} onValueChange={onChange} options={[...PRESET_TONES.map((t) => ({ value: t.id, label: t.label })), { value: "silent", label: "Silent" }]} />
      <Button type="button" variant="outline" size="icon" className="size-11 shrink-0" onClick={() => playTone(value)} disabled={value === "silent"} aria-label="Play this sound" title="Play">
        <PlayIcon />
      </Button>
    </div>
  );
}
