import { useCallback, useEffect, useState } from 'react';
import {
  isSoundEnabled,
  playSound,
  setSoundEnabled,
  type SfxScope,
  type SoundName,
} from '@/lib/feedback';

/**
 * Sons d'interaction — façade historique, désormais câblée sur
 * `@/lib/feedback` (synthèse Web Audio, plus aucun fichier `.mp3`).
 *
 * L'API (`play` / `enabled` / `toggle`) est conservée, ainsi que les noms
 * d'origine : `pop`, `whoosh`, `chime`, `fanfare`.
 */

export type SfxName = 'pop' | 'whoosh' | 'chime' | 'fanfare';

/** Anciens noms → sons de synthèse correspondants. */
const SFX_ALIASES: Record<SfxName, SoundName> = {
  pop: 'select',
  whoosh: 'whoosh',
  chime: 'chest',
  fanfare: 'complete',
};

export function useSfx(scope: SfxScope = 'app') {
  const [enabled, setEnabled] = useState(() => isSoundEnabled(scope));

  // Le réglage est partagé : un autre onglet (ou le SoundToggle) peut le changer.
  useEffect(() => {
    const sync = () => setEnabled(isSoundEnabled(scope));
    window.addEventListener('storage', sync);
    window.addEventListener('cia-sfx-change', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('cia-sfx-change', sync);
    };
  }, [scope]);

  const toggle = useCallback(() => {
    const next = !isSoundEnabled(scope);
    setSoundEnabled(next);
    setEnabled(next);
    window.dispatchEvent(new Event('cia-sfx-change'));
  }, [scope]);

  const play = useCallback(
    (name: SfxName) => {
      playSound(SFX_ALIASES[name], { scope });
    },
    [scope],
  );

  return { enabled, toggle, play };
}
