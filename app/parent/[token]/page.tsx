import { supabaseAdmin } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

const SCORE_MAP: Record<string, number> = { 'ممتاز بجدارة': 5, 'ممتاز': 4, 'جيد جدًا': 3, 'جيد': 2, 'ضعيف': 1 };

export default async function ParentPage({ params }: { params: { token: string } }) {
  const supabase = supabaseAdmin();

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('share_token', params.token)
    .maybeSingle();

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg" dir="rtl">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
          <div className="font-bold text-danger mb-1">رابط غير صالح</div>
          <div className="text-sm text-gray-500">هذا الرابط غير موجود أو تم إلغاؤه.</div>
        </div>
      </div>
    );
  }

  const { data: logs } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('student_id', student.id)
    .neq('attendance', 'غياب المحفّظ')
    .order('log_date', { ascending: false })
    .limit(20);

  const allLogs = logs || [];
  const total = allLogs.length;
  const pct = (pred: (l: any) => boolean) => (total === 0 ? 0 : Math.round((allLogs.filter(pred).length / total) * 100));
  const attendanceRate = pct((l) => l.attendance === 'حاضر');

  function avgGrade(field: string) {
    const graded = allLogs.filter((l) => l[field] && SCORE_MAP[l[field]]);
    if (graded.length === 0) return '—';
    return Math.round((graded.reduce((sum, l) => sum + SCORE_MAP[l[field]], 0) / graded.length) * 100) / 100 + ' / 5';
  }

  return (
    <div className="min-h-screen bg-[#F7F4EC]" dir="rtl">
      <div
        style={{ background: 'linear-gradient(150deg,#0A3527,#0F4C3A)' }}
        className="text-white p-6 text-center"
      >
        <div className="text-xs text-[#CFE3D8] mb-1">حلقة أهل القرآن</div>
        <div className="font-bold text-xl" style={{ fontFamily: 'Cairo, sans-serif' }}>
          {student.full_name}
        </div>
        {student.total_memorized && (
          <div className="text-xs text-[#F3E8C7] mt-1">كمية المحفوظات الإجمالية: {student.total_memorized}</div>
        )}
      </div>

      <div className="p-5 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-5 mb-4 border border-[#E4DFD0]">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="font-bold text-lg text-[#0A3527]">{attendanceRate}%</div>
              <div className="text-[11px] text-gray-500">نسبة الحضور</div>
            </div>
            <div>
              <div className="font-bold text-lg text-[#0A3527]">{avgGrade('new_grade')}</div>
              <div className="text-[11px] text-gray-500">متوسط الحفظ</div>
            </div>
            <div>
              <div className="font-bold text-lg text-[#0A3527]">{avgGrade('review_grade')}</div>
              <div className="text-[11px] text-gray-500">متوسط المراجعة</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E4DFD0]">
          <div className="font-bold text-sm text-[#0A3527] mb-3">آخر الجلسات</div>
          {allLogs.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-4">لا توجد سجلات بعد</div>
          ) : (
            <div className="space-y-3">
              {allLogs.slice(0, 10).map((l) => (
                <div key={l.id} className="border-b border-[#E4DFD0] pb-2 text-sm">
                  <div className="flex justify-between text-gray-500 text-xs mb-1">
                    <span>{l.log_date}</span>
                    <span>{l.attendance}</span>
                  </div>
                  {l.new_amount && (
                    <div>
                      حفظ جديد: {l.new_amount} {l.new_grade ? `(${l.new_grade})` : ''}
                    </div>
                  )}
                  {l.review_amount && (
                    <div>
                      مراجعة: {l.review_amount} {l.review_grade ? `(${l.review_grade})` : ''}
                    </div>
                  )}
                  {l.notes && <div className="text-gray-600 mt-1">ملاحظة: {l.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-[11px] text-gray-400 mt-4">هذه الصفحة للاطلاع فقط.</div>
      </div>
    </div>
  );
}
