'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';
import AppShell from '@/components/AppShell';

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const SCORE_MAP: Record<string, number> = { 'ممتاز بجدارة': 5, 'ممتاز': 4, 'جيد جدًا': 3, 'جيد': 2, 'ضعيف': 1 };

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function toStr(d: Date) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// يحسب بداية ونهاية أسبوع (أحد إلى سبت) يحتوي التاريخ المُعطى
function weekRange(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay()); // أقرب أحد سابق أو نفس اليوم
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { from: toStr(start), to: toStr(end) };
}

export default function ReportsPage() {
  const supabase = supabaseBrowser();
  const [mode, setMode] = useState<'individual' | 'combined'>('individual');
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupFilter, setGroupFilter] = useState<'general' | 'private' | 'all'>('general');
  const [combinedRows, setCombinedRows] = useState<any[]>([]);
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly');
  const [weekAnchor, setWeekAnchor] = useState(todayStr());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('students').select('*').order('full_name');
      setStudents(data || []);
      if (data && data.length) setStudentId(data[0].id);
    })();
  }, []);

  function currentRange() {
    if (mode === 'combined' && period === 'weekly') return weekRange(weekAnchor);
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { from, to };
  }

  async function generate() {
    if (!studentId) return;
    setLoading(true);
    const { from, to } = currentRange();
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
    if (mode === 'individual' && studentId) generate();
    if (mode === 'combined') generateCombined();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, year, month, mode, groupFilter, period, weekAnchor]);

  async function generateCombined() {
    setLoading(true);
    const { from, to } = currentRange();

    const activeStudents = students.filter((s) => {
      if (s.status !== 'نشط') return false;
      if (groupFilter === 'general') return !s.is_private;
      if (groupFilter === 'private') return s.is_private;
      return true; // all
    });
    const rows: any[] = [];
    for (const s of activeStudents) {
      const { data: studentLogs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('student_id', s.id)
        .gte('log_date', from)
        .lte('log_date', to)
        .neq('attendance', 'غياب المحفّظ')
        .order('log_date', { ascending: true });

      const sLogs = studentLogs || [];
      const total = sLogs.length;
      const attendanceRate =
        total === 0 ? null : Math.round((sLogs.filter((l) => l.attendance === 'حاضر').length / total) * 100);
      const lastWithNote = [...sLogs].reverse().find((l) => l.notes);
      const lastBehavior = [...sLogs].reverse().find((l) => l.behavior)?.behavior;

      rows.push({
        name: s.full_name,
        isPrivate: s.is_private,
        totalMemorized: s.total_memorized || '—',
        attendanceRate,
        lastBehavior: lastBehavior || '—',
        lastNote: lastWithNote?.notes || '—',
        logs: sLogs // التفاصيل الكاملة، تُستخدم بعرض التقرير الأسبوعي فقط
      });
    }
    setCombinedRows(rows);
    setLoading(false);
  }

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
      Math.round((graded.reduce((sum, l) => sum + SCORE_MAP[l[field]], 0) / graded.length) * 100) / 100 + ' / 5'
    );
  }

  const range = currentRange();

  return (
    <AppShell>
      <style>{`
        @media print {
          nav, .no-print, header, .topbar { display: none !important; }
          body { background: white !important; }
          .print-area { box-shadow: none !important; border: none !important; }
          .student-block { page-break-inside: avoid; }
        }
      `}</style>

      <div className="card no-print mb-4">
        <h2 className="font-heading font-bold text-base text-primarydark mb-3.5">تقارير قابلة للطباعة</h2>
        <div className="flex gap-2 mb-3.5">
          <button className={mode === 'individual' ? 'btn' : 'btn-ghost btn'} onClick={() => setMode('individual')}>
            تقرير فردي
          </button>
          <button className={mode === 'combined' ? 'btn' : 'btn-ghost btn'} onClick={() => setMode('combined')}>
            تقرير شامل لكل الطلاب
          </button>
        </div>

        {mode === 'combined' && (
          <div className="flex gap-2 mb-3.5">
            <button className={period === 'monthly' ? 'btn !py-2 text-xs' : 'btn-ghost btn !py-2 text-xs'} onClick={() => setPeriod('monthly')}>
              شهري
            </button>
            <button className={period === 'weekly' ? 'btn !py-2 text-xs' : 'btn-ghost btn !py-2 text-xs'} onClick={() => setPeriod('weekly')}>
              أسبوعي
            </button>
          </div>
        )}

        <div className="flex gap-3 flex-wrap items-end">
          {mode === 'individual' && (
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
          )}

          {(mode === 'individual' || period === 'monthly') && (
            <>
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
            </>
          )}

          {mode === 'combined' && period === 'weekly' && (
            <div>
              <label className="label">أي يوم ضمن الأسبوع المطلوب</label>
              <input type="date" className="input" value={weekAnchor} onChange={(e) => setWeekAnchor(e.target.value)} />
              <div className="text-[11px] text-inksoft mt-1">
                الأسبوع: {range.from} إلى {range.to}
              </div>
            </div>
          )}

          <button className="btn btn-gold" onClick={() => window.print()}>
            طباعة / حفظ PDF
          </button>
        </div>

        {mode === 'combined' && (
          <div className="flex gap-2 mt-3">
            <button
              className={groupFilter === 'general' ? 'btn !py-2 text-xs' : 'btn-ghost btn !py-2 text-xs'}
              onClick={() => setGroupFilter('general')}
            >
              الطلاب العامون فقط
            </button>
            <button
              className={groupFilter === 'private' ? 'btn !py-2 text-xs' : 'btn-ghost btn !py-2 text-xs'}
              onClick={() => setGroupFilter('private')}
            >
              الحلقة الخاصة فقط
            </button>
            <button
              className={groupFilter === 'all' ? 'btn !py-2 text-xs' : 'btn-ghost btn !py-2 text-xs'}
              onClick={() => setGroupFilter('all')}
            >
              الجميع معًا
            </button>
          </div>
        )}

        <p className="text-inksoft text-xs mt-2">
          بزر "طباعة"، اختر "Save as PDF" أو "حفظ كـ PDF" من نافذة الطباعة بدل اسم الطابعة، للحصول على ملف PDF جاهز.
        </p>
      </div>

      {mode === 'combined' ? (
        loading ? (
          <div className="text-center py-8 text-inksoft text-sm">جارٍ التحميل...</div>
        ) : (
          <div className="card print-area">
            <div className="text-center mb-5 border-b border-line pb-4">
              <div className="font-heading font-extrabold text-xl text-primarydark">حلقة أهل القرآن</div>
              <div className="text-inksoft text-sm mt-1">
                {period === 'weekly'
                  ? `تقرير أسبوعي شامل — من ${range.from} إلى ${range.to}`
                  : `تقرير شامل — ${MONTH_NAMES[month - 1]} ${year}`}
              </div>
            </div>

            {combinedRows.length === 0 ? (
              <div className="text-center py-8 text-inksoft text-sm">لا يوجد طلاب لعرضهم</div>
            ) : period === 'monthly' ? (
              // ---------- عرض ملخّص مختصر (شهري) ----------
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-inksoft border-b border-line">
                    <th className="text-right p-2">الطالب</th>
                    <th className="text-right p-2">المحفوظ</th>
                    <th className="text-right p-2">نسبة الحضور</th>
                    <th className="text-right p-2">آخر تقييم سلوك</th>
                    <th className="text-right p-2">آخر ملاحظة</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedRows.map((r, i) => (
                    <tr key={i} className="border-b border-line">
                      <td className="p-2">
                        {r.name} {r.isPrivate && <span className="text-inksoft">(خاص)</span>}
                      </td>
                      <td className="p-2">{r.totalMemorized}</td>
                      <td className="p-2">{r.attendanceRate === null ? '—' : `${r.attendanceRate}%`}</td>
                      <td className="p-2">{r.lastBehavior}</td>
                      <td className="p-2">{r.lastNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              // ---------- عرض تفصيلي كامل (أسبوعي) ----------
              <div className="space-y-6">
                {combinedRows.map((r, i) => (
                  <div key={i} className="student-block">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-heading font-bold text-sm text-primarydark">{r.name}</div>
                      {r.isPrivate && <span className="badge badge-warn">خاص</span>}
                      <div className="text-inksoft text-xs">— نسبة الحضور: {r.attendanceRate === null ? '—' : `${r.attendanceRate}%`}</div>
                    </div>
                    {r.logs.length === 0 ? (
                      <div className="text-inksoft text-xs mb-3">لا توجد سجلات هذا الأسبوع</div>
                    ) : (
                      <table className="w-full text-xs mb-3">
                        <thead>
                          <tr className="text-inksoft border-b border-line">
                            <th className="text-right p-1.5">التاريخ</th>
                            <th className="text-right p-1.5">الحضور</th>
                            {!r.isPrivate && <th className="text-right p-1.5">الصلوات</th>}
                            <th className="text-right p-1.5">الحفظ الجديد</th>
                            <th className="text-right p-1.5">المراجعة</th>
                            <th className="text-right p-1.5">السلوك</th>
                            <th className="text-right p-1.5">ملاحظات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.logs.map((l: any) => (
                            <tr key={l.id} className="border-b border-line">
                              <td className="p-1.5">{l.log_date}</td>
                              <td className="p-1.5">{l.attendance || '—'}</td>
                              {!r.isPrivate && (
                                <td className="p-1.5">
                                  ع:{l.asr || '—'} م:{l.maghrib || '—'} ع:{l.isha || '—'}
                                </td>
                              )}
                              <td className="p-1.5">
                                {l.new_amount || '—'} {l.new_grade ? `(${l.new_grade})` : ''}
                              </td>
                              <td className="p-1.5">
                                {l.review_amount || '—'} {l.review_grade ? `(${l.review_grade})` : ''}
                              </td>
                              <td className="p-1.5">{l.behavior || '—'}</td>
                              <td className="p-1.5">{l.notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      ) : loading ? (
        <div className="text-center py-8 text-inksoft text-sm">جارٍ التحميل...</div>
      ) : (
        <div className="card print-area">
          <div className="text-center mb-5 border-b border-line pb-4">
            <div className="font-heading font-extrabold text-xl text-primarydark">حلقة أهل القرآن</div>
            <div className="text-inksoft text-sm mt-1">
              تقرير شهر {MONTH_NAMES[month - 1]} {year}
            </div>
            <div className="font-heading font-bold text-lg mt-2">{currentStudent?.full_name}</div>
            {currentStudent?.total_memorized && (
              <div className="text-inksoft text-xs mt-1">كمية المحفوظات الإجمالية: {currentStudent.total_memorized}</div>
            )}
          </div>

          <div className={`grid ${currentStudent?.is_private ? 'grid-cols-1' : 'grid-cols-4'} gap-3 mb-5`}>
            <div className="text-center border border-line rounded-lg p-3">
              <div className="font-heading font-extrabold text-lg text-primarydark">{attendanceRate}%</div>
              <div className="text-[11px] text-inksoft">نسبة الحضور</div>
            </div>
            {!currentStudent?.is_private && (
              <>
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
              </>
            )}
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
                  {!currentStudent?.is_private && <th className="text-right p-2">الصلوات</th>}
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
                    {!currentStudent?.is_private && (
                      <td className="p-2">
                        ع:{l.asr || '—'} م:{l.maghrib || '—'} ع:{l.isha || '—'}
                      </td>
                    )}
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
