'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useRole } from '@/lib/useRole';
import AppShell from '@/components/AnimatedNumber';
import AnimatedNumber from '@/components/AnimatedNumber';

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function DashboardPage() {
  const supabase = supabaseBrowser();
  const { isAdmin } = useRole();
  const [date, setDate] = useState(todayStr());
  const [totalStudents, setTotalStudents] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [isDayOff, setIsDayOff] = useState(false);
  const [repeatedAbsentees, setRepeatedAbsentees] = useState<string[]>([]);

  const dow = new Date(date + 'T00:00:00').getDay();

  const load = useCallback(async () => {
    const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'نشط');
    setTotalStudents(count || 0);

    const { data: logData } = await supabase
      .from('daily_logs')
      .select('*, students(full_name)')
      .eq('log_date', date);
    setLogs(logData || []);

    const { data: dayOffData } = await supabase.from('days_off').select('*').eq('log_date', date).maybeSingle();
    setIsDayOff(!!dayOffData);

    await checkRepeatedAbsences();
  }, [date, supabase]);

  async function checkRepeatedAbsences() {
    const { data: activeStudents } = await supabase.from('students').select('id, full_name').eq('status', 'نشط');
    if (!activeStudents) return;
    const flagged: string[] = [];
    for (const st of activeStudents) {
      const { data: recentLogs } = await supabase
        .from('daily_logs')
        .select('attendance, log_date')
        .eq('student_id', st.id)
        .neq('attendance', 'غياب المحفّظ')
        .order('log_date', { ascending: false })
        .limit(3);
      if (recentLogs && recentLogs.length === 3 && recentLogs.every((l) => l.attendance === 'غائب')) {
        flagged.push(st.full_name);
      }
    }
    setRepeatedAbsentees(flagged);
  }

  useEffect(() => {
    load();
  }, [load]);

  const present = logs.filter((l) => l.attendance === 'حاضر').length;
  const absent = logs.filter((l) => l.attendance === 'غائب').length;

  async function toggleDayOff() {
    if (isDayOff) {
      if (!confirm('هل تريد إلغاء تعطيل هذا اليوم؟')) return;
      await supabase.rpc('unset_day_off', { p_date: date });
    } else {
      if (!confirm('سيتم تسجيل جميع الطلاب كـ"غياب المحفّظ" لهذا اليوم دون احتساب غياب. متابعة؟')) return;
      await supabase.rpc('set_day_off', { p_date: date, p_reason: 'تعطيل يدوي' });
    }
    load();
  }

  return (
    <AppShell>
      {isDayOff && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="badge-danger card !p-3 mb-4 flex justify-between items-center text-sm font-bold overflow-hidden"
        >
          هذا اليوم مُعطّل (غياب المحفّظ) — لا يُحسب غيابًا على الطلاب
        </motion.div>
      )}

      {repeatedAbsentees.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="badge-danger card !p-3 mb-4 text-sm font-bold overflow-hidden"
        >
          تنبيه غياب متكرر (3 جلسات متتالية بدون حضور): {repeatedAbsentees.join('، ')}
        </motion.div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-4">
        {[
          { value: totalStudents, label: 'إجمالي الطلاب', color: 'text-primarydark' },
          { value: logs.length, label: 'تم تسجيلهم اليوم', color: 'text-primarydark' },
          { value: present, label: 'حاضر', color: 'text-primary' },
          { value: absent, label: 'غائب', color: 'text-danger' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="card text-center"
          >
            <div className={`font-heading font-extrabold text-2xl ${stat.color}`}>
              <AnimatedNumber value={stat.value} />
            </div>
            <div className="text-xs text-inksoft mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="card"
      >
        <h2 className="font-heading font-bold text-base text-primarydark mb-3.5">سجل اليوم — {DAY_NAMES[dow]}</h2>
        <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
          <input type="date" className="input max-w-[180px]" value={date} onChange={(e) => setDate(e.target.value)} />
          {isAdmin && (
            <button className="btn btn-danger" onClick={toggleDayOff}>
              {isDayOff ? 'إلغاء تعطيل هذا اليوم' : 'تعطيل الدار لهذا اليوم'}
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-inksoft text-sm">لا توجد سجلات لهذا اليوم بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-inksoft text-xs">
                  <th className="text-right p-2">الطالب</th>
                  <th className="text-right p-2">الحضور</th>
                  <th className="text-right p-2">العصر</th>
                  <th className="text-right p-2">المغرب</th>
                  <th className="text-right p-2">العشاء</th>
                  <th className="text-right p-2">الحفظ</th>
                  <th className="text-right p-2">المراجعة</th>
                  <th className="text-right p-2">السلوك</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.5) }}
                    className="border-t border-line"
                  >
                    <td className="p-2">{l.students?.full_name}</td>
                    <td className="p-2">
                      <span
                        className={`badge ${
                          l.attendance === 'حاضر' ? 'badge-ok' : l.attendance === 'غائب' ? 'badge-danger' : 'badge-warn'
                        }`}
                      >
                        {l.attendance}
                      </span>
                    </td>
                    <td className="p-2">{l.asr || '—'}</td>
                    <td className="p-2">{l.maghrib || '—'}</td>
                    <td className="p-2">{l.isha || '—'}</td>
                    <td className="p-2">
                      {l.new_amount || '—'} {l.new_grade ? `(${l.new_grade})` : ''}
                    </td>
                    <td className="p-2">
                      {l.review_amount || '—'} {l.review_grade ? `(${l.review_grade})` : ''}
                    </td>
                    <td className="p-2">{l.behavior || '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </AppShell>
  );
}
