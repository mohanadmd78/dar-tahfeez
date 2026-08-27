'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { useRole } from '@/lib/useRole';
import AppShell from '@/components/AnimatedNumber';

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

const GRADES = ['ممتاز بجدارة', 'ممتاز', 'جيد جدًا', 'جيد', 'ضعيف'];
const BEHAVIORS = ['ممتاز', 'جيد', 'يحتاج تحسين'];

const emptyForm = {
  new_amount: '',
  new_grade: '',
  review_amount: '',
  review_grade: '',
  behavior: '',
  notes: ''
};

export default function EntryPage() {
  const supabase =supabaseBrowser ();
  const { isAdmin, loading: roleLoading } = useRole();
  const [students, setStudents] = useState<any[]>([]);
  const [date, setDate] = useState(todayStr());
  const [studentId, setStudentId] = useState('');
  const [form, setForm] = useState<any>(emptyForm);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('students').select('*').eq('status', 'نشط').order('full_name');
      setStudents(data || []);
      if (data && data.length) setStudentId(data[0].id);
    })();
  }, []);

  const loadExisting = useCallback(async () => {
    if (!studentId) return;
    setForm(emptyForm);
    setMsg('');
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('log_date', date)
      .eq('student_id', studentId)
      .maybeSingle();
    if (data) {
      setForm({
        new_amount: data.new_amount || '',
        new_grade: data.new_grade || '',
        review_amount: data.review_amount || '',
        review_grade: data.review_grade || '',
        behavior: data.behavior || '',
        notes: data.notes || ''
      });
      setMsg('يوجد سجل محفوظ مسبقًا لهذا اليوم — أي حفظ جديد سيحدّثه');
    }
  }, [studentId, date]);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  function set(field: string, value: string) {
    setForm((f: any) => ({ ...f, [field]: value }));
  }

  async function save() {
    if (!studentId) {
      alert('اختر طالبًا');
      return;
    }
    const cleanedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value === '' ? null : value])
    );
    // لا نرسل أعمدة الحضور/الصلوات إطلاقًا هنا — upsert لن يلمسها إن كانت موجودة من صفحة "تسجيل جماعي"
    const { error } = await supabase
      .from('daily_logs')
      .upsert({ log_date: date, student_id: studentId, ...cleanedForm }, { onConflict: 'log_date,student_id' });
    if (error) {
      alert('حدث خطأ: ' + error.message);
      return;
    }
    setMsg('تم الحفظ ✓');
  }

  if (roleLoading) {
    return (
      <AppShell>
        <div className="text-center py-8 text-inksoft text-sm">جارٍ التحقق من الصلاحية...</div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="card text-center py-8">
          <div className="text-danger font-bold mb-1">هذه الصفحة مخصصة للمسؤول فقط</div>
          <div className="text-inksoft text-sm">صلاحيتك الحالية "مشاهد" — يمكنك عرض البيانات والتقارير فقط.</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="card">
        <h2 className="font-heading font-bold text-base text-primarydark mb-1">الإدخال اليومي</h2>
        <p className="text-inksoft text-xs mb-3.5">
          هذه الصفحة للحفظ والمراجعة والسلوك فقط. تسجيل الحضور والصلوات صار من صفحة "تسجيل جماعي".
        </p>

        <div className="flex gap-3.5 flex-wrap mb-3">
          <div className="flex-1 min-w-[160px]">
            <label className="label">التاريخ</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex-[2] min-w-[200px]">
            <label className="label">الطالب</label>
            <select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} {s.is_private ? '(حلقة خاصة)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div>
            <label className="label">مقدار الحفظ الجديد</label>
            <input
              className="input"
              placeholder="مثال: ربع حزب"
              value={form.new_amount}
              onChange={(e) => set('new_amount', e.target.value)}
            />
          </div>
          <div>
            <label className="label">تقدير الحفظ الجديد</label>
            <select className="input" value={form.new_grade} onChange={(e) => set('new_grade', e.target.value)}>
              <option value="">—</option>
              {GRADES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div>
            <label className="label">مقدار المراجعة</label>
            <input
              className="input"
              placeholder="مثال: جزء عم"
              value={form.review_amount}
              onChange={(e) => set('review_amount', e.target.value)}
            />
          </div>
          <div>
            <label className="label">تقدير المراجعة</label>
            <select className="input" value={form.review_grade} onChange={(e) => set('review_grade', e.target.value)}>
              <option value="">—</option>
              {GRADES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label className="label">تقييم السلوك</label>
          <select className="input" value={form.behavior} onChange={(e) => set('behavior', e.target.value)}>
            <option value="">—</option>
            {BEHAVIORS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="label">ملاحظات</label>
          <textarea className="input" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>

        <div className="flex items-center gap-3">
          <button className="btn" onClick={save}>
            حفظ السجل
          </button>
          <span className="text-inksoft text-xs">{msg}</span>
        </div>
      </div>
    </AppShell>
  );
}
