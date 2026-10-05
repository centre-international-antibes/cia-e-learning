import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Flame, Sparkles, Star } from 'lucide-react';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Pressable } from '@/components/ui/pressable';
import { ModuleObject } from '@/design-system/objects/ModuleObject';
import { objectForModule } from '@/design-system/objects/objectForModule';

/**
 * Feuille de départ de leçon.
 *
 * Ce qui se passe entre le tap sur un nœud et le player : on nomme le module,
 * on dit où on en est, et on propose **une seule action**. La feuille est
 * physique (vaul), elle se tire vers le bas, et l'écran du parcours recule
 * légèrement derrière elle.
 */

export interface LessonStartSheetModule {
  id: string;
  number: number;
  title: string;
  theme?: string;
  totalLessons: number;
  completedLessons: number;
  durationMinutes: number;
  xpReward: number;
}

interface Props {
  module: LessonStartSheetModule | null;
  tint: string;
  onOpenChange: (open: boolean) => void;
  onStart: (module: LessonStartSheetModule) => void;
}

export function LessonStartSheet({ module, tint, onOpenChange, onStart }: Props) {
  const { t } = useTranslation();
  if (!module) return null;

  const resumed = module.completedLessons > 0;

  return (
    <Drawer open onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-md">
        <DrawerHeader className="items-center text-center">
          <div
            className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full text-white"
            style={{
              background: tint,
              boxShadow: `0 6px 0 0 color-mix(in srgb, ${tint} 70%, black)`,
            }}
          >
            <ModuleObject
              name={objectForModule(module.id)}
              size={44}
              fill="rgba(255,255,255,.28)"
            />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">
            {t('parcours.moduleShort')} {String(module.number).padStart(2, '0')}
          </p>
          <DrawerTitle className="font-display text-2xl font-extrabold">
            {module.title}
          </DrawerTitle>
          {module.theme && (
            <DrawerDescription className="text-sm">{module.theme}</DrawerDescription>
          )}
        </DrawerHeader>

        <div className="grid grid-cols-3 gap-2 px-4">
          {[
            [Star, `${module.completedLessons}/${module.totalLessons}`, t('parcours.lessons')],
            [Clock, `${module.durationMinutes} min`, t('parcours.duration')],
            [Sparkles, `+${module.xpReward}`, 'XP'],
          ].map(([Icon, value, label], i) => {
            const I = Icon as React.ElementType;
            return (
              <div
                key={i}
                className="rounded-2xl border-2 border-ink-100 bg-card px-2 py-3 text-center"
              >
                <I className="mx-auto mb-1 h-4 w-4 text-muted-foreground" aria-hidden />
                <p className="font-display text-base font-extrabold tabular-nums">
                  {value as string}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">
                  {label as string}
                </p>
              </div>
            );
          })}
        </div>

        <DrawerFooter className="gap-2">
          <Pressable
            tone="primary"
            depth="lg"
            scope="player"
            className="h-14 w-full text-base"
            onClick={() => onStart(module)}
          >
            {resumed ? t('parcours.resume') : t('parcours.start')}
          </Pressable>
          <DrawerClose asChild>
            <button
              type="button"
              className="py-2 font-mono text-[11px] uppercase tracking-[.18em] text-muted-foreground"
            >
              {t('parcours.close')}
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
