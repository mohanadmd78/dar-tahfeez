'use client';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { supabaseBrowser } from '@/lib/supabaseClient';
import AppShell from '@/components/AppShell';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const SCORE_MAP: Record<string, number> = { 'ممتاز': 4, 'جيد جدًا': 3, 'جيد': 2, 'ضعيف': 1 };

export default function StatsPage() {
  const supabase = supabaseBrowser();
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('students').select('*').order('full_name');
      setStudents(data || []);
      if (data && data.length) setStudentId(data[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      const { data } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('student_id', studentId)
        .neq('attendance', 'غياب المحفّظ')
        .order('log_date', { ascending: true });
      setLogs(data || []);
    })();
  }, [studentId]);

  const total = logs.length;
  const pct = (pred: (l: any) => boolean) => (total === 0 ? 0 : Math.round((logs.filter(pred).length / total) * 100));
  const attendanceRate = pct((l) => l.attendance === 'حاضر');
  const asr = pct((l) => l.asr === 'حاضر');
  const maghrib = pct((l) => l.maghrib === 'حاضر');
  const isha = pct((l) => l.isha === 'حاضر');

  function avgGrade(field: string) {
    const graded = logs.filter((l) => l[field] && SCORE_MAP[l[field]]);
    if (graded.length === 0) return null;
    return Math.round((graded.reduce((sum, l) => sum + SCORE_MAP[l[field]], 0) / graded.length) * 100) / 100;
  }

  const chartData = {
    labels: logs.map((l) => l.log_date),
    datasets: [
      {
        label: 'تقدير الحفظ الجديد',
        data: logs.map((l) => SCORE_MAP[l.new_grade] ?? null),
        borderColor: '#0F4C3A',
        spanGaps: true,
        tension: 0.3
      },
      {
        label: 'تقدير المراجعة',
        data: logs.map((l) => SCORE_MAP[l.review_grade] ?? null),
        borderColor: '#C9A227',
        spanGaps: true,
        tension: 0.3
      }
    ]
  };

  return (
    <AppShell>
      <div className="card">
        <h2 className="font-heading font-bold text-base text-primarydark mb-3.5">إحصائيات طالب</h2>
        <select className="input max-w-[320px] mb-4" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>

        {total === 0 ? (
          <div className="text-center py-8 text-inksoft text-sm">لا توجد سجلات لهذا الطالب بعد</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="card !p-3 text-center">
                <div className="font-heading font-extrabold text-xl text-primarydark">{attendanceRate}%</div>
                <div className="text-[11px] text-inksoft">نسبة الحضور</div>
              </div>
              <div className="card !p-3 text-center">
                <div className="font-heading font-extrabold text-xl text-primarydark">{asr}%</div>
                <div className="text-[11px] text-inksoft">العصر</div>
              </div>
              <div className="card !p-3 text-center">
                <div className="font-heading font-extrabold text-xl text-primarydark">{maghrib}%</div>
                <div className="text-[11px] text-inksoft">المغرب</div>
              </div>
              <div className="card !p-3 text-center">
                <div className="font-heading font-extrabold text-xl text-primarydark">{isha}%</div>
                <div className="text-[11px] text-inksoft">العشاء</div>
              </div>
            </div>
            <div className="text-inksoft text-xs mb-4">
              عدد الجلسات المُحتسبة: {total} — متوسط تقدير الحفظ: {avgGrade('new_grade') ?? '—'} / 4 — متوسط تقدير المراجعة:{' '}
              {avgGrade('review_grade') ?? '—'} / 4
            </div>
            <Line data={chartData} options={{ scales: { y: { min: 0, max: 4, ticks: { stepSize: 1 } } } }} />
          </>
        )}
      </div>
    </AppShell>
  );
}
