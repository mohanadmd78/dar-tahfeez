'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('البريد أو كلمة المرور غير صحيحة');
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg,#0A3527,#0F4C3A)' }}
    >
      <form onSubmit={handleLogin} className="bg-white rounded-2xl p-10 w-[360px] max-w-[90vw] text-center shadow-2xl">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full border-2 border-gold text-gold flex items-center justify-center font-heading font-extrabold text-2xl">
          ق
        </div>
        <h1 className="font-heading font-extrabold text-lg text-primarydark mb-1">دار التحفيظ</h1>
        <p className="text-inksoft text-xs mb-5">هذه الصفحة خاصة بالمحفّظ / المسؤول فقط</p>

        <div className="text-right mb-3">
          <label className="label">البريد الإلكتروني</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="text-right mb-2">
          <label className="label">كلمة المرور</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="btn w-full mt-3" disabled={loading}>
          {loading ? 'جارٍ الدخول...' : 'دخول'}
        </button>
        {error && <div className="text-danger text-xs mt-2">{error}</div>}
      </form>
    </div>
  );
}
