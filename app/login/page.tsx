'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
      {/* نسيج زخرفي هندسي ينجرف ببطء */}
      <motion.svg
        className="absolute w-[140%] h-[140%] -left-[20%] -top-[20%] opacity-[0.07]"
        aria-hidden="true"
        animate={{ x: [0, 20, 0], y: [0, 14, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          <pattern id="geo" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M28 2 L54 28 L28 54 L2 28 Z" fill="none" stroke="#C9A227" strokeWidth="1" />
            <circle cx="28" cy="28" r="5" fill="none" stroke="#C9A227" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#geo)" />
      </motion.svg>

      <motion.form
        onSubmit={handleLogin}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative bg-white rounded-[28px] p-10 pt-14 w-[380px] max-w-[92vw] text-center"
        style={{ boxShadow: '0 30px 80px -20px rgba(10,53,39,0.55), 0 0 0 1px rgba(201,162,39,0.15)' }}
      >
        {/* شعار على شكل قوس محراب - يُرسم بحركة عند التحميل */}
        <div className="absolute -top-9 left-1/2 -translate-x-1/2">
          <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
            <motion.path
              d="M8 68 V34 A30 30 0 0 1 68 34 V68"
              fill="#0F4C3A"
              stroke="#C9A227"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: 'easeInOut', delay: 0.15 }}
            />
            <motion.path
              d="M8 68 V34 A30 30 0 0 1 68 34 V68"
              fill="none"
              stroke="#C9A227"
              strokeWidth="2"
              transform="scale(0.82) translate(8.3,8.3)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            />
            <motion.text
              x="38"
              y="52"
              textAnchor="middle"
              fontFamily="Cairo, sans-serif"
              fontWeight="800"
              fontSize="22"
              fill="#F3E8C7"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 1.05, ease: 'backOut' }}
            >
              ق
            </motion.text>
          </svg>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="font-heading font-extrabold text-xl text-primarydark mb-1.5 mt-1"
        >
          حلقة أهل القرآن
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-inksoft text-xs mb-6"
        >
          هذه الصفحة خاصة بالمحفّظ / المسؤول فقط
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
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
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-danger text-xs mt-2.5"
            >
              {error}
            </motion.div>
          )}
        </motion.div>

        <div className="flex items-center gap-2 justify-center mt-6 opacity-40">
          <span className="w-8 h-px bg-inksoft" />
          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
          <span className="w-8 h-px bg-inksoft" />
        </div>
      </motion.form>
    </div>
  );
}
