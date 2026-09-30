import type { ReactNode } from "react";

/** Shared input look without size or border colour, so variants never carry conflicting utilities. */
export const inputBaseClass =
  "w-full rounded-[18px] border-2 bg-white text-brown outline-none placeholder:text-muted focus:border-gold focus:ring-4 focus:ring-cream";

export const inputClass = `${inputBaseClass} h-13 border-beige px-4 text-base`;

export const primaryButtonClass =
  "flex h-16 w-full items-center justify-between rounded-full border-2 border-gold bg-gold px-7 text-lg tracking-wide text-brown shadow-[0_6px_0_var(--color-gold-shadow)] transition hover:translate-y-0.5 hover:shadow-[0_4px_0_var(--color-gold-shadow)] disabled:translate-y-0 disabled:opacity-60 sm:h-[74px] sm:px-9 sm:text-[19px]";

export const pillClass =
  "flex h-11 items-center justify-center gap-2 rounded-full border-2 px-4 text-[15px] transition sm:px-5";

/** Bilingual label in the reference site's style: small English caps over the Chinese name. */
export function FieldLabel({ en, children, optional }: { en: string; children: ReactNode; optional?: boolean }) {
  return (
    <>
      <span className="font-display text-xs font-bold tracking-[0.14em] text-gold-ink sm:text-[13px]">{en}</span>
      <span className="text-sm sm:text-[15px]">{children}</span>
      {optional && <span className="text-xs text-muted sm:text-[13px]">選填</span>}
    </>
  );
}

export const labelRowClass = "flex items-baseline gap-2 sm:gap-2.5";

/** Large English display word with its Chinese heading underneath. */
export function SectionTitle({ en, children }: { en: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 sm:gap-3">
      <span className="font-display text-5xl leading-none font-bold text-gold-ink lg:text-[80px]">{en}</span>
      <h1 className="text-[22px] tracking-[0.08em] lg:text-[32px]">{children}</h1>
    </div>
  );
}
