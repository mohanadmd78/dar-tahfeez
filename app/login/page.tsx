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
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg,#0A3527,#0F4C3A)' }}
    >
      {/* نسيج زخرفي هندسي خفيف بالخلفية */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" aria-hidden="true">
        <defs>
          <pattern id="geo" width="56" height="56" patternUnits="userSpaceOnUse">
            <path
              d="M28 2 L54 28 L28 54 L2 28 Z"
              fill="none"
              stroke="#C9A227"
              strokeWidth="1"
            />
            <circle cx="28" cy="28" r="5" fill="none" stroke="#C9A227" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#geo)" />
      </svg>

      <form
        onSubmit={handleLogin}
        className="relative bg-white rounded-[28px] p-10 pt-14 w-[380px] max-w-[92vw] text-center"
        style={{ boxShadow: '0 30px 80px -20px rgba(10,53,39,0.55), 0 0 0 1px rgba(201,162,39,0.15)' }}
      >
        {/* شعار على شكل قوس محراب */}
        <div className="absolute -top-9 left-1/2 -translate-x-1/2">
          <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
            <path
              d="M8 68 V34 A30 30 0 0 1 68 34 V68"
              fill="#0F4C3A"
              stroke="#C9A227"
              strokeWidth="2"
            />
            <path
              d="M8 68 V34 A30 30 0 0 1 68 34 V68"
              fill="none"
              stroke="#C9A227"
              strokeWidth="2"
              transform="scale(0.82) translate(8.3,8.3)"
              opacity="0.6"
            />
            <text
              x="38"
              y="52"
              textAnchor="middle"
              fontFamily="Cairo, sans-serif"
              fontWeight="800"
              fontSize="22"
              fill="#F3E8C7"
            >
              ق
            </text>
          </svg>
        </div>

        <h1 className="font-heading font-extrabold text-xl text-primarydark mb-1.5 mt-1">حلقة أهل القرآن</h1>
        <p className="text-inksoft text-xs mb-6">هذه الصفحة خاصة بالمحفّظ / المسؤول فقط</p>

        <div className="text-right mb-3.5">
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

        <button className="btn w-full mt-4" disabled={loading}>
          {loading ? 'جارٍ الدخول...' : 'دخول'}
        </button>
        {error && <div className="text-danger text-xs mt-2.5">{error}</div>}

        <div className="flex items-center gap-2 justify-center mt-6 opacity-40">
          <span className="w-8 h-px bg-inksoft" />
          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
          <span className="w-8 h-px bg-inksoft" />
        </div>
      </form>
    </div>
  );
}
