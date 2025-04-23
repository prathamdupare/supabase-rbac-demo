'use client';

import { useSupabaseSession } from '@/components/supabaseSessionProvider';
import Link from 'next/link';

export default function Home() {
  const session = useSupabaseSession();
  if (!session) {
    return (
      <div>
        <h1>Welcome</h1>
        <Link href="/auth">Sign In / Sign Up</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Home</h1>
      <p>Welcome, {session.user.email}!</p>
      <Link href="/protected">Go to Protected</Link>
    </div>
  );
}
