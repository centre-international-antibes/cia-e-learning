import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  CreditCard,
  Settings,
  Wand2,
  LogOut,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const adminNavItems = [
  { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users },
  { label: 'Cours', href: '/admin/cours', icon: BookOpen },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Abonnements', href: '/admin/abonnements', icon: CreditCard },
  { label: 'Paramètres', href: '/admin/parametres', icon: Settings },
  { label: 'Motion Lab', href: '/admin/motion-lab', icon: Wand2 },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/connexion" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-primary text-primary-foreground transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-primary-foreground/10">
          {!collapsed && (
            <Link to="/admin" className="font-display text-sm font-bold">
              CIA — Admin
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10 hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {adminNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-foreground/20 to-primary-foreground/5 text-primary-foreground shadow-sm'
                    : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-primary-foreground/10 p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors mb-1"
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Voir le site</span>}
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/80 px-3 sm:px-4 backdrop-blur pt-safe">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden min-h-touch min-w-touch"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <nav className="scroll-x no-scrollbar flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap min-w-0">
            <Link to="/admin" className="hover:text-foreground transition-colors">Admin</Link>
            {(() => {
              const current = adminNavItems.find((i) => i.href === location.pathname);
              if (!current || current.href === '/admin') return null;
              return (
                <>
                  <span className="text-muted-foreground/50">/</span>
                  <span className="text-foreground font-medium">{current.label}</span>
                </>
              );
            })()}
          </nav>
          <div className="flex-1" />
          <span className="hidden md:inline text-xs text-muted-foreground truncate max-w-[200px]">
            {user?.email}
          </span>
        </header>

        <main className="p-3 sm:p-4 lg:p-6 pb-safe">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
