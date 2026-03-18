import { useState, useEffect, useCallback } from 'react';
import type { Profile } from '@/types/database';

interface UseProfileReturn {
  profile: Profile | null;
  email: string | null;
  loading: boolean;
  updateProfile: (updates: Record<string, unknown>) => Promise<Profile | null>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch('/api/profile');
      if (!cancelled && res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setEmail(data.email ?? null);
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const updateProfile = useCallback(async (updates: Record<string, unknown>): Promise<Profile | null> => {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      const data = await res.json();
      setProfile(data.profile);
      return data.profile as Profile;
    }
    return null;
  }, []);

  return { profile, email, loading, updateProfile };
}
