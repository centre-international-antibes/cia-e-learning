import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { CoursePlayer, type LessonResult } from '@/components/course-player/CoursePlayer';
import type { CourseContent } from '@/data/course-content';

/**
 * Mini-leçon de démonstration — 2 QCM et un texte à trous, données en dur.
 *
 * Elle sert à éprouver la boucle complète du player sans compte ni serveur :
 * sélection avant validation, CheckBar, combo, rejeu d'une erreur, sons.
 */
const DEMO_LESSON: CourseContent = {
  courseId: 'motion-lab-demo',
  steps: [
    {
      id: 'demo-1',
      type: 'lesson',
      title: 'Les salutations',
      content:
        "Trois formules suffisent pour commencer :\n\n**Bonjour** — le matin et l'après-midi.\n**Bonsoir** — le soir.\n**Salut** — entre amis, à toute heure.",
      tip: '💡 « Bonjour » passe partout : c’est le plus sûr.',
    },
    {
      // Phrase volontairement longue : sa solution occupe trois lignes sur
      // mobile, de quoi vérifier que le panneau grandit vers le haut sans
      // déplacer le bouton.
      id: 'demo-2',
      type: 'drag-drop',
      title: 'Remettez la phrase dans l’ordre',
      instruction: 'Vous réservez par téléphone. Cliquez les mots dans le bon ordre.',
      items: [
        'Je',
        'voudrais',
        'réserver',
        'une',
        'chambre',
        'double',
        'avec',
        'vue',
        'sur',
        'la',
        'mer',
        'pour',
        'deux',
        'nuits',
        'à',
        'partir',
        'de',
        'vendredi',
        'prochain',
      ],
      correctOrder: [
        'Je',
        'voudrais',
        'réserver',
        'une',
        'chambre',
        'double',
        'avec',
        'vue',
        'sur',
        'la',
        'mer',
        'pour',
        'deux',
        'nuits',
        'à',
        'partir',
        'de',
        'vendredi',
        'prochain',
      ],
    },
    {
      id: 'demo-3',
      type: 'qcm',
      title: 'Quelle salutation ?',
      question: 'Il est 9 h du matin. Que dites-vous ?',
      options: ['Bonsoir', 'Bonne nuit', 'Bonjour', 'Au revoir'],
      correctIndex: 2,
      explanation: '« Bonjour » couvre le matin et l’après-midi.',
    },
    {
      id: 'demo-4',
      type: 'fill-blank',
      title: 'Complétez',
      sentence: '— ___, je m’appelle Lucas. Et vous ?',
      options: ['Au revoir', 'Bonjour', 'Bonne nuit', 'À demain'],
      correctAnswer: 'Bonjour',
    },
    {
      id: 'demo-5',
      type: 'qcm',
      title: 'Formel ou informel ?',
      question: 'Vous parlez à votre professeur. Que dites-vous ?',
      options: ['Salut !', 'Bonjour, Madame.', 'Coucou !', 'Yo !'],
      correctIndex: 1,
      explanation: 'Avec un professeur : « Bonjour » + le titre.',
    },
  ],
};

export function PlayerLabPanel() {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<LessonResult | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setPlaying(true)}>Lancer la mini-leçon</Button>
        {lastResult && (
          <Button variant="ghost" onClick={() => setLastResult(null)}>
            Effacer le résultat
          </Button>
        )}
      </div>

      {lastResult ? (
        <p className="font-mono text-xs text-muted-foreground">
          Résultat remonté : score {lastResult.score} % · {lastResult.correct} bonnes réponses sur{' '}
          {lastResult.questionCount} · meilleure série {lastResult.bestCombo}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Trompez-vous volontairement sur une question : elle doit revenir en fin de leçon, derrière
          l’intertitre « {t('player.replayTitle')} », sans changer le score remonté.
        </p>
      )}

      {playing && (
        <CoursePlayer
          content={DEMO_LESSON}
          courseTitle="Motion Lab — mini-leçon"
          onExit={() => setPlaying(false)}
          onComplete={(result) => {
            setLastResult(result);
            setPlaying(false);
          }}
        />
      )}
    </div>
  );
}
