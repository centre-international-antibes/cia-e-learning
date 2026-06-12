import { useState, useEffect, FormEvent } from 'react';
import { lovable } from '@/integrations/lovable/index';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, Loader2, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

import { toast } from 'sonner';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthTabs } from '@/components/auth/AuthTabs';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { signInSchema, signUpSchema } from '@/lib/validators/auth';

type Tab = 'login' | 'signup';

const INTERESTED_PLAN_LS_KEY = 'cia-interested-plan';
type InterestedPlan = 'premium' | 'school' | 'cia';
const VALID_PLANS: InterestedPlan[] = ['premium', 'school', 'cia'];


export default function Connexion() {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialTab: Tab = location.pathname === '/inscription' ? 'signup' : 'login';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [postAuthRedirect, setPostAuthRedirect] = useState<string | null>(null);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Capture interest in a paid plan when coming from Pricing CTAs.
  // TODO(sprint-4): persist this in `subscriptions.interested_plan` once
  // the BDD migration is done, instead of localStorage.
  useEffect(() => {
    const plan = searchParams.get('plan') ?? searchParams.get('context');
    if (plan && VALID_PLANS.includes(plan as InterestedPlan)) {
      try {
        localStorage.setItem(INTERESTED_PLAN_LS_KEY, plan);
      } catch {
        /* localStorage disabled in private mode — silently ignore */
      }
    }
  }, [searchParams]);

  const baseRedirect = searchParams.get('redirect') || '/dashboard';
  const redirectTo = postAuthRedirect ?? baseRedirect;


  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  if (user) return null;

  const isLogin = tab === 'login';

  const validate = () => {
    const schema = isLogin ? signInSchema : signUpSchema;
    const payload = isLogin
      ? { email, password }
      : { email, password, firstName, lastName };
    const result = schema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) toast.error(error.message);
        else {
          toast.success(t('auth.loginSuccess'));
          // No direct navigate(): the `useEffect` watching `user` will fire
          // exactly one `navigate(redirectTo, { replace: true })` once the
          // session is applied. Navigating here *and* there in the same tick
          // wedges `AnimatePresence mode="wait"` and leaves <main> blank
          // until a hard refresh.
        }
      } else {
        const interestedPlan = (() => {
          try {
            return localStorage.getItem(INTERESTED_PLAN_LS_KEY) ?? undefined;
          } catch {
            return undefined;
          }
        })();
        const { error } = await signUp(email, password, {
          first_name: firstName,
          last_name: lastName,
          ...(interestedPlan ? { interested_plan: interestedPlan } : {}),
        });
        if (error) toast.error(error.message);
        else {
          toast.success(t('auth.signupSuccess'));
          // Same as login — defer the navigation to the user effect. We just
          // override the redirect target so the welcome flag is preserved.
          setPostAuthRedirect('/dashboard?welcome=1');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (v: Tab) => {
    setTab(v);
    setErrors({});
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}${redirectTo}`,
    });
    if (result.error) {
      toast.error(result.error.message || `Erreur de connexion ${provider}`);
    }
    // redirected = browser handles the redirect flow
  };

  return (
    <AuthShell
      title={isLogin ? t('auth.welcomeTitle') : t('auth.createAccount')}
      subtitle={isLogin ? t('auth.loginSubtitle') : t('auth.signupSubtitle')}
    >
      <Card className="border-border/60 shadow-xl rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <AuthTabs value={tab} onChange={switchTab} />


          <AnimatePresence mode="wait" initial={false}>
            <motion.form
              key={tab}
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={{ opacity: 0, x: isLogin ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 16 : -16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {!isLogin && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={t('auth.firstNamePlaceholder')}
                        className="pl-9"
                        maxLength={50}
                        aria-invalid={!!errors.firstName}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-xs text-destructive">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t('auth.lastNamePlaceholder')}
                      maxLength={50}
                      aria-invalid={!!errors.lastName}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="pl-10"
                    autoComplete="email"
                    required
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  {isLogin && (
                    <Link
                      to="/mot-de-passe-oublie"
                      className="text-xs text-accent hover:underline"
                    >
                      {t('auth.forgotPassword')}
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                    minLength={isLogin ? undefined : 6}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? t('auth.hide') : t('auth.show')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
                {!isLogin && <PasswordStrength value={password} />}
              </div>

              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isLogin ? t('auth.signingIn') : t('auth.signingUp')}
                    </>
                  ) : isLogin ? (
                    t('auth.signIn')
                  ) : (
                    t('auth.signUp')
                  )}
                </Button>
              </motion.div>

              {!isLogin && (
                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  {t('auth.legalPrefix')}{' '}
                  {/* TODO(sprint-3): wire /cgu and /confidentialite routes when legal copy is ready */}
                  <a href="/cgu" className="underline hover:text-foreground">{t('auth.legalTerms')}</a>
                  {' '}{t('auth.legalAnd')}{' '}
                  <a href="/confidentialite" className="underline hover:text-foreground">
                    {t('auth.legalPrivacy')}
                  </a>
                  .
                </p>
              )}

              <div className="relative flex items-center justify-center gap-3 py-1">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">ou</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleOAuthSignIn('google')}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleOAuthSignIn('apple')}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-.07.07-2.87 1.73-2.84 5.14.03 4.1 3.53 5.46 3.61 5.48-.03.1-.56 1.92-1.81 3.59zM12.03 7.25c-.15-2.11 1.66-4.04 3.74-4.25.29 2.32-2.14 4.37-3.74 4.25z" fill="currentColor"/>
                  </svg>
                  Apple
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                {isLogin ? (
                  <>
                    {t('auth.noAccountYet')}{' '}
                    <button
                      type="button"
                      onClick={() => switchTab('signup')}
                      className="text-accent hover:underline font-medium"
                    >
                      {t('auth.signUp')}
                    </button>
                  </>
                ) : (
                  <>
                    {t('auth.alreadyAccount')}{' '}
                    <button
                      type="button"
                      onClick={() => switchTab('login')}
                      className="text-accent hover:underline font-medium"
                    >
                      {t('auth.signIn')}
                    </button>
                  </>
                )}
              </div>
            </motion.form>
          </AnimatePresence>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
