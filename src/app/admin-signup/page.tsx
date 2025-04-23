'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminSignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp(
      { email, password },
      { data: { role: 'admin' } }  // ← here’s where you pass the role
    );

    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      alert('Check your email to confirm—then you’re an admin!');
      router.push('/');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: 400, margin: 'auto', padding: 32 }}
    >
      <h1>Sign Up as Admin</h1>
      <label>
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label>
        Password
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Signing Up…' : 'Sign Up as Admin'}
      </button>
    </form>
  );
}
