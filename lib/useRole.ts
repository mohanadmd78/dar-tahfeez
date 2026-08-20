'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from './supabaseClient';

export function useRole() {
  const [role, setRole] = useState<'admin' | 'viewer' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      setRole((data?.role as 'admin' | 'viewer') || 'viewer');
      setLoading(false);
    })();
  }, []);

  return { role, loading, isAdmin: role === 'admin' };
}
