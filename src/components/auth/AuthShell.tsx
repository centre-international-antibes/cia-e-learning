import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import logoCia from '@/assets/picto-cia.png.asset.json';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

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
            className="h-48 md:h-56 w-auto mx-auto mb-4 drop-shadow-sm"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'backOut' }}
          />
          <p
            className="text-5xl md:text-6xl lg:text-7xl leading-[1.05] mt-8 md:mt-10 px-2"
            style={{ fontFamily: "'Better Together', cursive", color: '#e64353' }}
          >
            Don't learn French, live it
          </p>
          <h1 className="font-display text-2xl font-bold text-primary mt-3">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
          )}
        </div>
        {children}
      </motion.div>
    </div>
  );
}