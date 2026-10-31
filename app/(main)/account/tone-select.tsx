"use client";

import { PlayIcon } from "lucide-react";
import { nativeSelectClass } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { PRESET_TONES } from "@/lib/push/tones";
import { playTone } from "./device-push";

/** The notification sound list with a ▶ to hear the picked one. Shared by My account and the sign-in prompt. */
export function ToneSelect({ id, name, value, onChange }: { id: string; name?: string; value: string; onChange: (tone: string) => void }) {
  return (
    <div className="flex gap-2">
      <select id={id} name={name} value={value} onChange={(e) => onChange(e.target.value)} className={nativeSelectClass}>
        {PRESET_TONES.map((t) => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
        <option value="silent">Silent</option>
      </select>
      <Button type="button" variant="outline" size="icon" className="size-11 shrink-0" onClick={() => playTone(value)} disabled={value === "silent"} aria-label="Play this sound" title="Play">
        <PlayIcon />
      </Button>
    </div>
  );
}
