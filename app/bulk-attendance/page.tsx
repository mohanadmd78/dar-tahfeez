'use client';
import { useEffect, useState } from 'react';
import {supabaseBrowser } from '@/lib/supabaseClient';
import { useRole } from '@/lib/useRole';
import AppShell from '@/components/AppShell';

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

type RowState = {
  studentId: string;
  name: string;
  isPrivate: boolean;
  attendance: 'حاضر' | 'غائب';
  asr: 'حاضر' | 'غائب';
  maghrib: 'حاضر' | 'غائب';
  isha: 'حاضر' | 'غائب';
};

export default function BulkAttendancePage() {
  const supabase =supabaseBrowser();
  const { isAdmin, loading: roleLoading } = useRole();
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('status', 'نشط')
      .order('full_name');

    const { data: existingLogs } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('log_date', date)
      .neq('attendance', 'غياب المحفّظ');

    const logsByStudent: Record<string, any> = {};
    (existingLogs || []).forEach((l) => {
      logsByStudent[l.student_id] = l;
    });

    const built: RowState[] = (students || []).map((s) => {
      const existing = logsByStudent[s.id];
      return {
        studentId: s.id,
        name: s.full_name,
        isPrivate: !!s.is_private,
        attendance: (existing?.attendance as any) || 'حاضر',
        asr: (existing?.asr as any) || 'حاضر',
        maghrib: (existing?.maghrib as any) || 'حاضر',
        isha: (existing?.isha as any) || 'حاضر'
      };
    });
    setRows(built);
    setLoading(false);
    setMsg('');
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function toggle(studentId: string, field: 'attendance' | 'asr' | 'maghrib' | 'isha') {
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, [field]: r[field] === 'حاضر' ? 'غائب' : 'حاضر' } : r))
    );
  }

  function markAllPresent() {
    setRows((prev) => prev.map((r) => ({ ...r, attendance: 'حاضر', asr: 'حاضر', maghrib: 'حاضر', isha: 'حاضر' })));
  }

  async function saveAll() {
    setSaving(true);
    setMsg('');
    const payload = rows.map((r) => ({
      log_date: date,
      student_id: r.studentId,
      attendance: r.attendance,
      asr: r.isPrivate ? null : r.asr,
      maghrib: r.isPrivate ? null : r.maghrib,
      isha: r.isPrivate ? null : r.isha
    }));

    // upsert بدون تحديد أعمدة الحفظ/المراجعة/السلوك يمسحها إذا كانت موجودة مسبقًا لنفس اليوم،
    // لذلك نجلب القيم الحالية أولاً وندمجها قبل الإرسال حفاظًا عليها
    const { data: existingLogs } = await supabase
      .from('daily_logs')
      .select('student_id, new_amount, new_grade, review_amount, review_grade, behavior, notes')
      .eq('log_date', date);
    const existingByStudent: Record<string, any> = {};
    (existingLogs || []).forEach((l) => {
      existingByStudent[l.student_id] = l;
    });

    const finalPayload = payload.map((p) => ({
      ...p,
      new_amount: existingByStudent[p.student_id]?.new_amount ?? null,
      new_grade: existingByStudent[p.student_id]?.new_grade ?? null,
      review_amount: existingByStudent[p.student_id]?.review_amount ?? null,
      review_grade: existingByStudent[p.student_id]?.review_grade ?? null,
      behavior: existingByStudent[p.student_id]?.behavior ?? null,
      notes: existingByStudent[p.student_id]?.notes ?? null
    }));

    const { error } = await supabase
      .from('daily_logs')
      .upsert(finalPayload, { onConflict: 'log_date,student_id' });

    setSaving(false);
    if (error) {
      setMsg('حدث خطأ: ' + error.message);
      return;
    }
    setMsg('تم حفظ الحضور لكل الطلاب ✓');
  }

  if (roleLoading || loading) {
    return (
      <AppShell>
        <div className="text-center py-8 text-inksoft text-sm">جارٍ التحميل...</div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="card text-center py-8">
          <div className="text-danger font-bold mb-1">هذه الصفحة مخصصة للمسؤول فقط</div>
        </div>
      </AppShell>
    );
  }

  const generalRows = rows.filter((r) => !r.isPrivate);
  const privateRows = rows.filter((r) => r.isPrivate);

  function Cell({ value, onClick }: { value: 'حاضر' | 'غائب'; onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        className={`w-full py-1.5 rounded-md text-xs font-bold border ${
          value === 'حاضر' ? 'bg-primarysoft border-primary text-primarydark' : 'bg-dangersoft border-danger text-danger'
        }`}
      >
        {value}
      </button>
    );
  }

  return (
    <AppShell>
      <div className="card mb-4">
        <h2 className="font-heading font-bold text-base text-primarydark mb-1">تسجيل جماعي</h2>
        <p className="text-inksoft text-xs mb-3.5">
          كل الطلاب افتراضيًا "حاضر". دوّس على اسم أي طالب أو أي صلاة غاب عنها لتحويلها "غائب". دوّس "حفظ الكل" مرة وحدة بالآخر.
        </p>
        <div className="flex gap-3 flex-wrap items-center">
          <input type="date" className="input max-w-[180px]" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="btn-ghost btn" onClick={markAllPresent}>
            تصفير الكل لـ"حاضر"
          </button>
          <button className="btn" onClick={saveAll} disabled={saving}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ الكل'}
          </button>
          <span className="text-inksoft text-xs">{msg}</span>
        </div>
      </div>

      {generalRows.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-heading font-bold text-sm text-primarydark mb-3">الطلاب العامون (الأحد–الأربعاء)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-inksoft text-xs">
                  <th className="text-right p-2">الطالب</th>
                  <th className="text-right p-2 w-24">الحضور</th>
                  <th className="text-right p-2 w-24">العصر</th>
                  <th className="text-right p-2 w-24">المغرب</th>
                  <th className="text-right p-2 w-24">العشاء</th>
                </tr>
              </thead>
              <tbody>
                {generalRows.map((r) => (
                  <tr key={r.studentId} className="border-t border-line">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2">
                      <Cell value={r.attendance} onClick={() => toggle(r.studentId, 'attendance')} />
                    </td>
                    <td className="p-2">
                      <Cell value={r.asr} onClick={() => toggle(r.studentId, 'asr')} />
                    </td>
                    <td className="p-2">
                      <Cell value={r.maghrib} onClick={() => toggle(r.studentId, 'maghrib')} />
                    </td>
                    <td className="p-2">
                      <Cell value={r.isha} onClick={() => toggle(r.studentId, 'isha')} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {privateRows.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-heading font-bold text-sm text-primarydark mb-3">الحلقة الخاصة (الخميس–السبت)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-inksoft text-xs">
                  <th className="text-right p-2">الطالب</th>
                  <th className="text-right p-2 w-24">الحضور</th>
                </tr>
              </thead>
              <tbody>
                {privateRows.map((r) => (
                  <tr key={r.studentId} className="border-t border-line">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2">
                      <Cell value={r.attendance} onClick={() => toggle(r.studentId, 'attendance')} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rows.length === 0 && <div className="card text-center py-8 text-inksoft text-sm">لا يوجد طلاب نشطون</div>}

      <p className="text-inksoft text-xs">
        بعد الحضور، إذا حبيت تسجّل حفظ أو مراجعة لطالب معيّن، روح لصفحة "إدخال يومي" واختاره — سجل الحضور يلي حفظته هلق رح
        يبقى محفوظ ومش رح ينمسح.
      </p>
    </AppShell>
  );
}
