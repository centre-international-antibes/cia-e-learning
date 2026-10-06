import * as React from 'react';
import { BookOpen } from 'lucide-react';

/**
 * Bannière d'unité.
 *
 * Le bloc de couleur pleine largeur qui manquait : **109 pt de haut sur toute la
 * largeur** dans la référence, contre une carte blanche posée sur du blanc chez
 * nous. C'est lui qui donne à l'écran son ancrage de couleur — le seul endroit
 * où la teinte du niveau CECR occupe une vraie surface.
 *
 * La teinte vient du niveau, jamais d'un bouton : règle des rôles de couleur.
 */

export interface UnitBannerProps {
  /** Teinte CECR en `hsl(...)`. */
  tint: string;
  /** « SECTION A1 · UNITÉ 1 ». */
  eyebrow: string;
  title: string;
  /** « 3 / 5 modules ». */
  meta: string;
  onOpenIndex?: () => void;
  indexLabel: string;
}

export const UNIT_BANNER_HEIGHT = 104;

export function UnitBanner({
  tint,
  eyebrow,
  title,
  meta,
  onOpenIndex,
  indexLabel,
}: UnitBannerProps) {
  return (
    <div
      className="relative flex items-stretch overflow-hidden rounded-[20px] text-white"
      style={{
        background: tint,
        minHeight: UNIT_BANNER_HEIGHT,
        boxShadow: `0 6px 0 0 color-mix(in srgb, ${tint} 72%, black)`,
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-white/80">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-extrabold leading-tight">{title}</h2>
        <p className="text-sm font-medium text-white/85">{meta}</p>
      </div>

      {onOpenIndex && (
        <button
          type="button"
          onClick={onOpenIndex}
          aria-label={indexLabel}
          className="flex w-16 shrink-0 items-center justify-center border-l border-white/25 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
        >
          <BookOpen className="h-6 w-6" aria-hidden />
        </button>
      )}
    </div>
  );
}
