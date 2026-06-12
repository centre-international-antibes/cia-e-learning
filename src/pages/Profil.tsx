import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { PersonalInfoForm } from '@/components/profile/PersonalInfoForm';
import { AchievementsShowcase } from '@/components/profile/AchievementsShowcase';
import { AccountActions } from '@/components/profile/AccountActions';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { ProfileHeaderSkeleton } from '@/components/states/skeletons/ProfileHeaderSkeleton';
import { Flame, Trophy, Zap } from 'lucide-react';

const LEAGUE_LABEL: Record<string, { label: string; emoji: string }> = {
  bronze: { label: 'Bronze', emoji: '🥉' },
  argent: { label: 'Argent', emoji: '🥈' },
  or:     { label: 'Or',     emoji: '🥇' },
};

export default function Profil() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const { totalXP, cecrLevel, xpProgress } = useUserProgress();
  const { streak } = useDailyChallenge();

  useEffect(() => {
    if (!isLoading && !user) navigate('/connexion', { replace: true });
  }, [user, isLoading, navigate]);

  if (isLoading || !user || profileLoading) {
    return (
      <div className="container max-w-4xl py-6 sm:py-10 px-4 space-y-5">
        <h1 className="font-display text-2xl sm:text-3xl text-primary">{t('profile.title')}</h1>
        <ProfileHeaderSkeleton />
      </div>
    );
  }

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() || user.email;
  const league = profile?.league && LEAGUE_LABEL[profile.league];

  return (
    <div className="container max-w-4xl py-6 sm:py-10 px-4 space-y-5 animate-fade-in">
      <h1 className="font-display text-2xl sm:text-3xl text-primary">{t('profile.title')}</h1>

      {/* Identité */}
      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <AvatarUpload
              currentUrl={profile?.avatar_url ?? null}
              onUploaded={() => refetch()}
              size={112}
            />
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-3 w-full">
              <div className="space-y-1">
                <p className="font-display text-xl truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge variant="secondary" className="rounded-full gap-1.5 px-3 py-1">
                  <Zap className="h-3 w-3" /> {cecrLevel}
                </Badge>
                <Badge variant="secondary" className="rounded-full gap-1.5 px-3 py-1">
                  <Flame className="h-3 w-3 text-streak-500" /> {streak} j
                </Badge>
                {league && (
                  <Badge variant="secondary" className="rounded-full gap-1.5 px-3 py-1">
                    <Trophy className="h-3 w-3 text-cia-gold-500" /> {league.emoji} {league.label}
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-bold">{totalXP.toLocaleString()} XP</span>
                  <span className="text-muted-foreground">
                    {xpProgress.current} / {xpProgress.needed}
                  </span>
                </div>
                <Progress value={xpProgress.progress} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Infos perso */}
      <Card className="rounded-2xl">
        <CardContent className="p-5 sm:p-6">
          <h2 className="font-display text-lg mb-4">{t('profile.personal_info')}</h2>
          <PersonalInfoForm />
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="rounded-2xl">
        <CardContent className="p-5 sm:p-6">
          <h2 className="font-display text-lg mb-4">{t('profile.achievements.title')}</h2>
          <AchievementsShowcase />
        </CardContent>
      </Card>

      {/* Compte */}
      <Card className="rounded-2xl">
        <CardContent className="p-5 sm:p-6">
          <h2 className="font-display text-lg mb-4">{t('profile.account')}</h2>
          <AccountActions />
        </CardContent>
      </Card>
    </div>
  );
}