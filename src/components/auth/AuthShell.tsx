import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import logoCia from '@/assets/picto-cia.png.asset.json';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * Slogan de marque — **volontairement hors i18n**, et en anglais partout.
 *
 * C'est la seule exception à la règle « toute chaîne passe par i18n » de
 * `CLAUDE.md` : une signature de marque ne se traduit pas, elle se reconnaît.
 * Un apprenant russe ou allemand voit la même ligne qu'un francophone, comme
 * il voit le même logo. Si le CIA décide un jour de la décliner par langue,
 * c'est six clés à ajouter et cette constante à retirer.
 *
 * Il était jusqu'ici composé en `'Better Together'`, une police commerciale de
 * Katsia Jazwinska **jamais chargée** : absente de Google Fonts et jamais
 * auto-hébergée, elle tombait sur le `cursive` du navigateur — Comic Sans sous
 * Windows. Si le CIA détient une licence web de cette police, c'est elle qu'il
 * faut auto-héberger : c'est la police d'origine de la marque. En attendant,
 * Sacramento, déjà dans `public/fonts/`.
 */
const SLOGAN = "Don't learn French, live it";

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-muted/30">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.img
            src={logoCia.url}
            alt="Centre International d'Antibes"
            className="h-48 md:h-56 w-auto mx-auto mb-2 drop-shadow-sm"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'backOut' }}
          />
          <p
            className="font-slogan text-3xl md:text-4xl lg:text-5xl leading-[1.05] -mt-10 md:-mt-14 mb-2 px-2 text-cia-red-400"
          >
            {SLOGAN}
          </p>
          <h1 className="font-display text-2xl font-bold text-primary mt-2">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
          )}
        </div>
        {children}
      </motion.div>
    </div>
  );
}