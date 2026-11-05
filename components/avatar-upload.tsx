"use client";

import { useRef, useState, useTransition } from "react";
import { Menu } from "@base-ui/react/menu";
import { CameraIcon, ImagePlusIcon, Trash2Icon } from "lucide-react";
import { removeAvatar, saveAvatar } from "@/app/(main)/account/actions";
import { AVATAR_PX, AVATAR_SOURCE_MAX_BYTES, centerSquare, type AvatarPerson } from "@/lib/avatar";
import { encodeCanvas } from "@/lib/markup/encode";
import { markedName } from "@/lib/markup/export";
import { discardUpload, uploadFile } from "@/lib/uploads/client";
import { IMAGE_TYPES } from "@/lib/uploads/limits";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./user-avatar";

// Changing your photo right from your avatar, wherever it's offered, without opening your profile first.

/** The picked image as a small centred square, ready to upload: a phone photo of several MB becomes a few KB. */
async function toAvatarFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("This image couldn't be opened. Try another one.");
  });
  const { x, y, size } = centerSquare(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = AVATAR_PX;
  const ctx = canvas.getContext("2d")!;
  // White behind see-through parts: otherwise the initials underneath show through, or a JPEG turns them black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, AVATAR_PX, AVATAR_PX);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, x, y, size, size, 0, 0, AVATAR_PX, AVATAR_PX);
  bitmap.close();
  const out = await encodeCanvas(canvas);
  if (!out) throw new Error("This image couldn't be prepared. Try another one.");
  return new File([out.blob], markedName("profile.png", out.format), { type: out.format.mime });
}

/** Choosing, uploading and removing a photo. Render `input` once; `choose` opens it. */
export function useAvatarUpload() {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, startRemoving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File) {
    setError(null);
    if (!IMAGE_TYPES.includes(file.type)) return setError("Use a PNG, JPEG, WebP or GIF image. HEIC photos can't be added.");
    if (file.size > AVATAR_SOURCE_MAX_BYTES) return setError(`This photo is larger than ${AVATAR_SOURCE_MAX_BYTES / 1024 / 1024} MB.`);
    setUploading(true);
    let id: string | null = null;
    try {
      ({ id } = await uploadFile(await toAvatarFile(file), "IMAGE", () => {}).done);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The photo couldn't be uploaded. Try again.");
      setUploading(false);
      return;
    }
    try {
      const r = await saveAvatar(id);
      if (!r.ok) setError(r.message ?? "The photo couldn't be saved. Try again.");
    } catch {
      // Not saved, so the upload would only wait for the nightly clean-up.
      void discardUpload(id);
      setError("The photo couldn't be saved. Check the connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  return {
    busy: uploading || removing,
    error,
    clearError: () => setError(null),
    choose: () => ref.current?.click(),
    remove: () => {
      setError(null);
      startRemoving(async () => {
        try {
          await removeAvatar();
        } catch {
          setError("The photo couldn't be removed. Check the connection and try again.");
        }
      });
    },
    input: (
      <input
        ref={ref}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        aria-label="Profile photo"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void pick(f);
        }}
      />
    ),
  };
}

const menuItem =
  "flex cursor-default items-center gap-2.5 rounded-md px-3 py-2.5 text-[0.9063rem] outline-hidden select-none data-highlighted:bg-acc-t2 data-highlighted:text-acc-ink [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

const avatarButton =
  "relative shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-3 focus-visible:ring-acc/40 active:opacity-80 disabled:cursor-default disabled:opacity-60";

/**
 * The avatar as the button: with no photo a tap opens the file picker, with one it offers Change and Remove. `children` sit
 * beside it, and any problem shows under both.
 */
export function AvatarUpload({ person, avatarClassName, className, children }: { person: AvatarPerson; avatarClassName: string; className?: string; children?: React.ReactNode }) {
  const upload = useAvatarUpload();
  const face = (
    <>
      <UserAvatar person={person} className={cn(avatarClassName, upload.busy && "animate-pulse")} />
      <span aria-hidden className="absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full bg-card text-acc-ink shadow-[0_0_0_0.0625rem_var(--ln)]">
        <CameraIcon className="size-3.5" />
      </span>
    </>
  );
  return (
    <div className={cn("grid gap-2", className)}>
      {upload.input}
      <div className="flex items-center gap-3.5">
        {person.avatarName ? (
          <Menu.Root>
            <Menu.Trigger disabled={upload.busy} aria-label="Change or remove your profile photo" className={avatarButton}>
              {face}
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner side="bottom" align="start" sideOffset={8} className="isolate z-50">
                <Menu.Popup className="w-52 origin-(--transform-origin) rounded-xl bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-150 ease-(--ease-out) data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
                  <Menu.Item className={menuItem} onClick={upload.choose}>
                    <ImagePlusIcon /> Change photo
                  </Menu.Item>
                  <Menu.Item className={menuItem} onClick={upload.remove}>
                    <Trash2Icon /> Remove photo
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        ) : (
          <button type="button" disabled={upload.busy} onClick={upload.choose} aria-label="Upload a profile photo" className={avatarButton}>
            {face}
          </button>
        )}
        {children}
      </div>
      {upload.error ? (
        <p role="alert" className="text-[0.8125rem] font-medium text-destructive-text">
          {upload.error}
        </p>
      ) : null}
    </div>
  );
}
