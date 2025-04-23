
// app/protected/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseSession } from '@/components/supabaseSessionProvider';
import { supabase } from '@/lib/supabaseClient';

export default function ProtectedPage() {
  const session = useSupabaseSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) {
      // not signed in → redirect to /auth
      router.replace('/auth');
      return;
    }
    // check role in public.users
    supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error || data?.role !== 'admin') setIsAdmin(false);
        else setIsAdmin(true);
      });
  }, [session, router]);

  if (isAdmin === null) return <div>Loading…</div>;
  if (!isAdmin) return <div>Access denied. Admins only.</div>;

  return (
    <div>
      <h1>Protected Admin Page</h1>
      <p>Only users with <code>role='admin'</code> in <code>public.users</code> see this.</p>
    </div>
  );
}
