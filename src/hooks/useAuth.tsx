import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { setActiveProgressUser } from '@/lib/courseProgress';
import { syncLessonProgressFromCloud } from '@/lib/lessonProgressSync';
import { toast } from 'sonner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, meta?: Record<string, string>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);

  const syncAdminRole = useCallback(async (userId?: string) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.warn('[auth] user_roles lookup failed', error.message);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data);
    } catch (error) {
      console.warn('[auth] user_roles lookup exception', error);
      setIsAdmin(false);
    }
  }, []);

  const applySession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    setActiveProgressUser(nextSession?.user?.id);
    void syncLessonProgressFromCloud(nextSession?.user?.id);
  }, []);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      // Always apply session updates, even before initial getSession() resolves.
      // Previously we dropped events while `initializedRef.current` was false,
      // which could race with sign-in: SIGNED_IN fires immediately after
      // signInWithPassword resolves, and skipping it left the app in a half-
      // hydrated state until a hard refresh.
      applySession(nextSession);
      if (!initializedRef.current) {
        initializedRef.current = true;
        setIsLoading(false);
      }
      void syncAdminRole(nextSession?.user?.id);
    });

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (!mounted) return;

        // Only apply if onAuthStateChange hasn't already initialized us
        // with a fresher session (typical after a fresh signIn).
        if (!initializedRef.current) {
          applySession(initialSession);
          initializedRef.current = true;
          setIsLoading(false);
          void syncAdminRole(initialSession?.user?.id);
        }
      } catch (error) {
        console.error('[auth] getSession failed', error);

        if (!mounted) return;

        applySession(null);
        initializedRef.current = true;
        setIsAdmin(false);
        setIsLoading(false);
      }
    };

    void initializeAuth();

    // Safety net: if getSession() never resolves (tab resumed from background,
 // frozen network, ...) unblock the UI after 2.5s so we never show an
 // infinite loader.
    const safetyTimer = window.setTimeout(() => {
      if (!mounted || initializedRef.current) return;
      console.warn('[auth] getSession timed out — unblocking UI');
      initializedRef.current = true;
      setIsLoading(false);
    }, 2500);

    return () => {
      mounted = false;
      window.clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [applySession, syncAdminRole]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, meta?: Record<string, string>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[signOut] error', error);
        toast.error(`Erreur déconnexion: ${error.message}`);
      }
    } catch (e: unknown) {
      console.error('[signOut] exception', e);
    } finally {
      // Force local cleanup even if the network call failed
      setSession(null);
      setIsAdmin(false);
      setActiveProgressUser(undefined);
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
          .forEach((k) => localStorage.removeItem(k));
      } catch { /* noop */ }
      // Hard redirect ensures every page resets its state
      window.location.href = '/connexion';
    }
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isAdmin, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
