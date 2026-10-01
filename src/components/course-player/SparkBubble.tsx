import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Spark, type SparkMood } from '@/components/spark/Spark';
import { SparkMini } from '@/components/spark/SparkMini';

interface Props {
  message: string;
  /** Mood applied to Spark while the bubble is visible. Default 'talking'.
   *  Ignored when size ≤ 48 (charte v2 §2 : SparkMini sans bouche). */
  mood?: SparkMood;
  /** Spark size in px. Default 48. */
  size?: number;
  /** Type the message character by character. Default true. */
  typing?: boolean;
  /** Typing speed in ms per character. Default 18. */
  typingSpeed?: number;
}

/**
 * SparkBubble — Spark mascot + dialogue bubble.
 * Drop-in replacement for the old CharacterBubble (Marie & co), now using
 * the official Spark mascot for all narrative bubbles in the course player.
 *
 * Sous 48px : bascule sur SparkMini (charte v2 §2).
 */
export function SparkBubble({
  message,
  mood = 'talking',
  size = 48,
  typing = true,
  typingSpeed = 18,
}: Props) {
  const [displayed, setDisplayed] = useState(typing ? '' : message);

  useEffect(() => {
    if (!typing) {
      setDisplayed(message);
      return;
    }
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplayed(message.slice(0, i));
      if (i >= message.length) clearInterval(id);
    }, typingSpeed);
    return () => clearInterval(id);
  }, [message, typing, typingSpeed]);

  const isTyping = typing && displayed.length < message.length;

  return (
    <div className="flex items-start gap-3">
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="shrink-0"
        title="Spark"
      >
        {size <= 48 ? <SparkMini size={size} /> : <Spark mood={mood} size={size} halo={false} />}
      </motion.div>
      <div className="min-w-0 flex-1">
        <div className="relative mt-1.5 bg-cia-blue-50 dark:bg-cia-blue-900/30 border-2 border-cia-spark-mid/30 rounded-2xl rounded-tl-sm px-4 py-2.5">
          <p className="text-sm text-foreground leading-relaxed">
            « {displayed}
            {isTyping && (
              <span className="inline-block w-[2px] h-4 align-middle bg-foreground/60 ml-0.5 animate-pulse" />
            )}
            {!isTyping && ' »'}
          </p>
        </div>
      </div>
    </div>
  );
}
