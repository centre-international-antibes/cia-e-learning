import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Headphones, Play, Volume2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ListeningStep as ListeningStepType } from '@/data/course-content';
import { SparkBubble } from './SparkBubble';
import { StepOption } from './StepOption';
import { useDeclareAnswer, useOptionShortcut, useStepController } from './step-controller';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  step: ListeningStepType;
  onSelect?: () => void;
}

export function ListeningStep({ step, onSelect }: Props) {
  const { t } = useTranslation();
  const { phase } = useStepController();
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasListened, setHasListened] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const revealed = phase === 'revealed';

  useDeclareAnswer(selected !== null, () => ({
    correct: selected === step.correctIndex,
    solution: step.options[step.correctIndex],
  }));

  useOptionShortcut((index) => {
    if (revealed || !hasListened || index >= step.options.length) return;
    setSelected(index);
    onSelect?.();
  });

  const handlePlay = useCallback(async () => {
    if (playing || loading) return;

    // If we already have the audio cached, just replay it
    if (audioBlobUrlRef.current) {
      const audio = new Audio(audioBlobUrlRef.current);
      audioRef.current = audio;
      audio.onplay = () => setPlaying(true);
      audio.onended = () => {
        setPlaying(false);
        setHasListened(true);
      };
      audio.onerror = () => {
        setPlaying(false);
        setHasListened(true);
      };
      await audio.play();
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken =
        sessionData.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            text: step.text,
            // voiceId/voiceSettings are omitted: the elevenlabs-tts edge
            // function falls back to its configured default voice.
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioBlobUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onplay = () => setPlaying(true);
      audio.onended = () => {
        setPlaying(false);
        setHasListened(true);
      };
      audio.onerror = () => {
        setPlaying(false);
        setHasListened(true);
      };

      setLoading(false);
      await audio.play();
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      setLoading(false);
      setHasListened(true);
    }
  }, [playing, loading, step.text]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Headphones className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold font-display">{step.title}</h2>
      </div>
      {/* Narrative bubble (Spark) */}
      {step.characterMessage && <SparkBubble message={step.characterMessage} />}

      {/* Audio player */}
      <Card className="border-2 bg-gradient-to-br from-cia-blue-50 to-card">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handlePlay}
              disabled={playing || loading}
              className={cn(
                'h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-lg',
                loading
                  ? 'bg-muted animate-pulse'
                  : playing
                    ? 'bg-primary/20 animate-pulse'
                    : 'bg-gradient-to-br from-cia-blue-500 to-cia-blue-700 hover:from-cia-blue-600 cursor-pointer',
              )}
            >
              {loading ? (
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              ) : playing ? (
                <Volume2 className="h-8 w-8 text-primary" />
              ) : (
                <Play className="h-8 w-8 text-primary-foreground ml-1" />
              )}
            </button>
            {playing && (
              <div className="flex items-end gap-1 h-6">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className="w-1 bg-cia-blue-500 rounded-full animate-pulse"
                    style={{ height: `${30 + (n % 3) * 30}%`, animationDelay: `${n * 80}ms` }}
                  />
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {loading
                ? t('player.generating', "Génération de l'audio...")
                : playing
                  ? t('player.listening')
                  : hasListened
                    ? t('player.clickToReplay')
                    : t('player.clickToListen')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      {hasListened && (
        <Card className="border-2">
          <CardContent className="p-6">
            <p className="mb-4 text-lg font-medium">{step.question}</p>
            <div className="grid gap-3" role="radiogroup" aria-label={step.question}>
              {step.options.map((opt, i) => (
                <StepOption
                  key={i}
                  label={opt}
                  marker={String(i + 1)}
                  selected={selected === i}
                  revealed={revealed}
                  isCorrect={i === step.correctIndex}
                  onSelect={() => {
                    if (revealed) return;
                    setSelected(i);
                    onSelect?.();
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
