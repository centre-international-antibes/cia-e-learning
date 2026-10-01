import { useEffect, useMemo, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';
import { feedback } from '@/lib/feedback';

interface XPBurstProps {
  x: number;
  y: number;
  amount: number;
  onComplete: () => void;
}

type ParticleType = 'sparkle' | 'star' | 'dot' | 'diamond';

interface Particle {
  id: number;
  type: ParticleType;
  /** Angle initial en radians, depuis l'origine */
  angle: number;
  /** Distance horizontale max (px) */
  reach: number;
  /** Hauteur du peak (px, négatif = vers le haut) */
  peak: number;
  /** Distance de chute après le peak (px) */
  fall: number;
  /** Taille en px */
  size: number;
  /** Délai de départ (ms) */
  delay: number;
  /** Rotation totale en degrés */
  rotation: number;
  /** Durée totale (ms) */
  duration: number;
  /** Couleur (hex) */
  color: string;
}

const PARTICLE_TYPES: ParticleType[] = ['sparkle', 'star', 'dot', 'diamond'];

const PARTICLE_COLORS = [
  '#CCAE62', // cia-gold-400
  '#E8C97A', // cia-gold-300
  '#F2D89A', // cia-gold-200
  '#FFD700', // pure gold pop
  '#FFFFFF', // white sparkle
];

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickType(): ParticleType {
  return PARTICLE_TYPES[Math.floor(Math.random() * PARTICLE_TYPES.length)];
}

function pickColor(): string {
  return PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + rand(-0.15, 0.15);
    return {
      id: i,
      type: pickType(),
      angle,
      reach: rand(50, 110) * Math.cos(angle - Math.PI / 2) * (Math.random() < 0.5 ? 1 : -1) * rand(0.6, 1),
      peak: -rand(40, 90),
      fall: rand(60, 120),
      size: Math.round(rand(8, 22)),
      delay: rand(0, 80),
      rotation: rand(-540, 540),
      duration: rand(900, 1300),
      color: pickColor(),
    };
  });
}

function ParticleNode({ particle, type }: { particle: Particle; type: ParticleType }) {
  const { size, color } = particle;
  if (type === 'sparkle') {
    return (
      <Sparkles
        className="drop-shadow-[0_0_4px_rgba(204,174,98,0.6)]"
        style={{ width: size, height: size, color }}
        fill={color}
      />
    );
  }
  if (type === 'star') {
    return (
      <Star
        className="drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]"
        style={{ width: size, height: size, color }}
        fill={color}
      />
    );
  }
  if (type === 'diamond') {
    return (
      <div
        style={{
          width: size * 0.7,
          height: size * 0.7,
          backgroundColor: color,
          transform: 'rotate(45deg)',
          boxShadow: `0 0 8px ${color}80`,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size * 0.5,
        height: size * 0.5,
        backgroundColor: color,
        borderRadius: '50%',
        boxShadow: `0 0 6px ${color}, 0 0 12px ${color}40`,
      }}
    />
  );
}

export function XPBurst({ x, y, amount, onComplete }: XPBurstProps) {
  const reduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const particleCount = reduced ? 0 : 20;
  const particles = useMemo(() => generateParticles(particleCount), [particleCount]);
  const totalDuration = reduced ? 600 : 1400;

  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const controls = animate(0, amount, {
      duration: reduced ? 0.25 : 0.55,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplayed(Math.round(v)),
    });
    return () => controls.stop();
  }, [amount, reduced]);

  useEffect(() => {
    const t = setTimeout(onComplete, totalDuration);
    return () => clearTimeout(t);
  }, [onComplete, totalDuration]);

  useEffect(() => {
    if (reduced) return;
    feedback.tap();
  }, [reduced]);

  return (
    <div
      className="fixed inset-0 z-[60] pointer-events-none"
      style={{ contain: 'layout' }}
      aria-hidden="true"
    >
      {!reduced && (
        <motion.div
          className="absolute rounded-full"
          style={{
            left: x,
            top: y,
            width: 80,
            height: 80,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(204,174,98,0.55) 0%, rgba(204,174,98,0) 70%)',
          }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 1, 0], scale: [0.3, 1.4, 1.8] }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      <motion.div
        className="absolute font-display font-extrabold text-cia-gold-500 text-2xl drop-shadow-[0_2px_8px_rgba(204,174,98,0.5)]"
        style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
        initial={{ opacity: 0, y: 0, scale: 0.5 }}
        animate={{
          opacity: [0, 1, 1, 0],
          y: -65,
          scale: [0.5, 1.15, 1, 0.95],
        }}
        transition={{
          duration: reduced ? 0.5 : 1.1,
          times: [0, 0.2, 0.7, 1],
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        +{displayed} XP
      </motion.div>

      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: x,
            top: y,
            transform: 'translate(-50%, -50%)',
            transformStyle: 'preserve-3d',
          }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0, rotateZ: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [0, p.reach * 0.55, p.reach],
            y: [0, p.peak, p.peak + p.fall],
            scale: [0, 1, 1, 0.4],
            rotateZ: [0, p.rotation * 0.5, p.rotation],
          }}
          transition={{
            duration: p.duration / 1000,
            delay: p.delay / 1000,
            times: [0, 0.15, 0.7, 1],
            ease: [0.18, 0.7, 0.32, 1],
          }}
        >
          <ParticleNode particle={p} type={p.type} />
        </motion.div>
      ))}
    </div>
  );
}
