import { Volume2, VolumeX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSfx } from '@/hooks/useSfx';
import type { SfxScope } from '@/lib/feedback';

export interface SoundToggleProps {
  /** Contexte d'appel : dans le player, le son est actif par défaut. */
  scope?: SfxScope;
  className?: string;
}

/**
 * Interrupteur son. Posé dans le header du player en M3 — ici, il n'est
 * encore branché nulle part en dehors du Motion Lab.
 */
export function SoundToggle({ scope = 'app', className }: SoundToggleProps) {
  const { enabled, toggle } = useSfx(scope);
  const label = enabled ? 'Couper le son' : 'Activer le son';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-pressed={enabled}
          aria-label={label}
          onClick={toggle}
          className={className}
        >
          {enabled ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
