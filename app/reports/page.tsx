'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';
import AppShell from '@/components/AppShell';

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const SCORE_MAP: Record<string, number> = { 'ممتاز': 4, 'جيد جدًا': 3, 'جيد': 2, 'ضعيف': 1 };

export default function ReportsPage() {
  const supabase = supabaseBrowser();
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('students').select('*').order('full_name');
      setStudents(data || []);
      if (data && data.length) setStudentId(data[0].id);
    })();
  }, []);

  async function generate() {
    if (!studentId) return;
    setLoading(true);
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('student_id', studentId)
      .gte('log_date', from)
      .lte('log_date', to)
      .neq('attendance', 'غياب المحفّظ')
      .order('log_date', { ascending: true });
    setLogs(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (studentId) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, year, month]);

  const currentStudent = students.find((s) => s.id === studentId);
  const total = logs.length;
  const pct = (pred: (l: any) => boolean) => (total === 0 ? 0 : Math.round((logs.filter(pred).length / total) * 100));
  const attendanceRate = pct((l) => l.attendance === 'حاضر');
  const asr = pct((l) => l.asr === 'حاضر');
  const maghrib = pct((l) => l.maghrib === 'حاضر');
  const isha = pct((l) => l.isha === 'حاضر');

  function avgGrade(field: string) {
    const graded = logs.filter((l) => l[field] && SCORE_MAP[l[field]]);
    if (graded.length === 0) return '—';
    return (
      Math.round((graded.reduce((sum, l) => sum + SCORE_MAP[l[field]], 0) / graded.length) * 100) / 100 + ' / 4'
    );
  }

  return (
    <AppShell>
      <style>{`
        @media print {
          nav, .no-print, header, .topbar { display: none !important; }
          body { background: white !important; }
          .print-area { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="card no-print mb-4">
        <h2 className="font-heading font-bold text-base text-primarydark mb-3.5">تقرير شهري قابل للطباعة</h2>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label">الطالب</label>
            <select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">السنة</label>
            <select className="input" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">الشهر</label>
            <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-gold" onClick={() => window.print()}>
            طباعة / حفظ PDF
          </button>
        </div>
        <p className="text-inksoft text-xs mt-2">
          بزر "طباعة"، اختر "Save as PDF" أو "حفظ كـ PDF" من نافذة الطباعة بدل اسم الطابعة، للحصول على ملف PDF جاهز.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-inksoft text-sm">جارٍ التحميل...</div>
      ) : (
        <div className="card print-area">
          <div className="text-center mb-5 border-b border-line pb-4">
            <div className="font-heading font-extrabold text-xl text-primarydark">دار التحفيظ</div>
            <div className="text-inksoft text-sm mt-1">
              تقرير شهر {MONTH_NAMES[month - 1]} {year}
            </div>
            <div className="font-heading font-bold text-lg mt-2">{currentStudent?.full_name}</div>
            {currentStudent?.total_memorized && (
              <div className="text-inksoft text-xs mt-1">كمية المحفوظات الإجمالية: {currentStudent.total_memorized}</div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3 mb-5">
            <div className="text-center border border-line rounded-lg p-3">
              <div className="font-heading font-extrabold text-lg text-primarydark">{attendanceRate}%</div>
              <div className="text-[11px] text-inksoft">نسبة الحضور</div>
            </div>
            <div className="text-center border border-line rounded-lg p-3">
              <div className="font-heading font-extrabold text-lg text-primarydark">{asr}%</div>
              <div className="text-[11px] text-inksoft">العصر</div>
            </div>
            <div className="text-center border border-line rounded-lg p-3">
              <div className="font-heading font-extrabold text-lg text-primarydark">{maghrib}%</div>
              <div className="text-[11px] text-inksoft">المغرب</div>
            </div>
            <div className="text-center border border-line rounded-lg p-3">
              <div className="font-heading font-extrabold text-lg text-primarydark">{isha}%</div>
              <div className="text-[11px] text-inksoft">العشاء</div>
            </div>
          </div>

          <div className="text-sm mb-4">
            متوسط تقدير الحفظ الجديد: <b>{avgGrade('new_grade')}</b> — متوسط تقدير المراجعة: <b>{avgGrade('review_grade')}</b>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-8 text-inksoft text-sm">لا توجد سجلات لهذا الشهر</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-inksoft border-b border-line">
                  <th className="text-right p-2">التاريخ</th>
                  <th className="text-right p-2">الحضور</th>
                  <th className="text-right p-2">الصلوات</th>
                  <th className="text-right p-2">الحفظ الجديد</th>
                  <th className="text-right p-2">المراجعة</th>
                  <th className="text-right p-2">السلوك</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-line">
                    <td className="p-2">{l.log_date}</td>
                    <td className="p-2">{l.attendance}</td>
                    <td className="p-2">
                      ع:{l.asr || '—'} م:{l.maghrib || '—'} ع:{l.isha || '—'}
                    </td>
                    <td className="p-2">
                      {l.new_amount || '—'} {l.new_grade ? `(${l.new_grade})` : ''}
                    </td>
                    <td className="p-2">
                      {l.review_amount || '—'} {l.review_grade ? `(${l.review_grade})` : ''}
                    </td>
                    <td className="p-2">{l.behavior || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </AppShell>
  );
}
