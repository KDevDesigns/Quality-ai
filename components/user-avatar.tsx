import { avatarColors, avatarSrc, type AvatarPerson } from "@/lib/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * A person's photo, or their initials in their own colours. The initials stay underneath a photo, so they still show if it
 * can't load. Decorative: the name is always written beside it.
 */
export function UserAvatar({ person, className }: { person: AvatarPerson; className?: string }) {
  const src = avatarSrc(person);
  return (
    <span aria-hidden style={avatarColors(person.avatarColor)} className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold", className)}>
      {initials(person.name)}
      {/* eslint-disable-next-line @next/next/no-img-element -- behind QA Hub's own login, so Next's image optimizer can't fetch it */}
      {src ? <img src={src} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" /> : null}
    </span>
  );
}
