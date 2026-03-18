import { createServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import SettingsClient from '@/components/settings/SettingsClient';

export const metadata = {
  title: 'Settings -- Rune',
};

export default async function SettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return <SettingsClient user={user} />;
}
