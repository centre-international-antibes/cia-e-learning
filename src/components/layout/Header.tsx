import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, User, LogOut, Crown, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserIndicators } from './UserIndicators';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MobileDrawer } from './MobileDrawer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const NAV: { to: string; key: string; onboard?: string }[] = [
  { to: '/catalogue',    key: 'nav.catalogue',       onboard: 'nav-catalogue' },
  { to: '/programme',    key: 'nav.curriculum',      onboard: 'nav-programme' },
  { to: '/classement',   key: 'nav.leaderboard',     onboard: 'nav-classement' },
  { to: '/defi-du-jour', key: 'nav.daily_challenge', onboard: 'nav-daily' },
];

export function Header() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const location = useLocation();

  // Safety net: close the mobile drawer on any route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    supabase.from('profiles').select('avatar_url').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.avatar_url) setAvatarUrl(data.avatar_url); });
  }, [user]);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'CI';

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm'
            : 'bg-card/95 backdrop-blur-xl border-b border-border/40'
        }`}
      >
        <div className="container flex h-24 sm:h-28 items-center justify-between gap-2 sm:gap-3 pt-safe">
          {/* Burger mobile + Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl min-h-touch min-w-touch"
              onClick={() => setDrawerOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Un seul marqueur de marque : le logo officiel CIA `picto.png`
                déposé dans les files du projet par Jules (hotfix test & learn).
                La goutte SparkMini + le texte « CIA / e-learning » qui
                doublonnaient ont été retirés du header. */}
            <Link to="/" className="flex items-center min-w-0" aria-label="CIA E-Learning, retour à l'accueil">
              <img
                src="/picto.png"
                alt="Centre International d'Antibes — E-Learning"
                className="h-16 sm:h-20 w-auto select-none shrink-0"
                draggable={false}
              />
            </Link>
          </div>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV.map(({ to, key, onboard }) => (
              <NavLink
                key={to}
                to={to}
                data-onboard={onboard}
                className={({ isActive }) =>
                  `relative px-3 py-2 text-sm font-bold rounded-xl transition-colors ${
                    isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {t(key)}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-2 -bottom-px h-0.5 bg-primary rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            {user && (
              <>
                <div className="hidden lg:flex">
                  <UserIndicators />
                </div>
                <div className="flex lg:hidden">
                  <UserIndicators compact />
                </div>
              </>
            )}

            <div className="hidden md:flex">
              <LanguageSwitcher />
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <Avatar className="h-9 w-9 border-2 border-primary/30">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="rounded-lg cursor-pointer">
                      <User className="h-4 w-4 mr-2" /> {t('nav.dashboard')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profil" className="rounded-lg cursor-pointer">
                      {t('nav.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favoris" className="rounded-lg cursor-pointer">
                      {t('nav.favorites')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/abonnement" className="rounded-lg cursor-pointer">
                      <Crown className="h-4 w-4 mr-2 text-cia-spark-mid" /> Mon abonnement
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/contact-cia" className="rounded-lg cursor-pointer">
                      <MessageCircle className="h-4 w-4 mr-2" /> Le Centre International d'Antibes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="rounded-lg cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/connexion">
                <Button size="sm" className="gap-2 btn-duo rounded-xl text-xs font-bold">
                  <User className="h-3.5 w-3.5" />
                  {t('nav.login')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
